import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import { OpenAI } from "langchain";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import ytdl from "ytdl-core";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Serve static files from the root directory
app.use(express.static(path.join(process.cwd())));
app.use(bodyParser.json());

// Validate required environment variables
const requiredEnvVars = ["OPENAI_API_KEY", "ASSEMBLYAI_API_KEY"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
  process.exit(1);
}

// Setup OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});

// LangChain Chain setup to generate blog post
const createBlogPostChain = () => {
  const prompt = new PromptTemplate({
    template: `Create a well-structured blog post based on this video transcription. 
    The blog post should:
    - Have a compelling title
    - Include an introduction
    - Break down the main points
    - Include a conclusion
    - Use proper formatting and structure
    
    Transcription: {transcription}`,
    inputVariables: ["transcription"],
  });

  return new LLMChain({
    llm: openai,
    prompt: prompt,
  });
};

// Endpoint to process YouTube URL and generate blog
app.post("/generate-blog", async (req, res) => {
  const { youtubeUrl } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(youtubeUrl)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Download audio from YouTube video
    const audioPath = await downloadAudio(youtubeUrl, tempDir);

    // Transcribe audio
    const transcription = await transcribeAudio(audioPath);

    // Use LangChain to generate blog post from transcription
    const chain = createBlogPostChain();
    const { text: blogPost } = await chain.call({ transcription });

    res.json({ blogPost });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Failed to generate blog post",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Function to download audio from YouTube video
const downloadAudio = async (youtubeUrl, tempDir) => {
  const pipelineAsync = promisify(pipeline);
  const audioFilePath = path.join(tempDir, `audio-${Date.now()}.mp3`);

  try {
    const stream = ytdl(youtubeUrl, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    // Save the audio stream to a file
    await pipelineAsync(stream, fs.createWriteStream(audioFilePath));

    return audioFilePath;
  } catch (error) {
    throw new Error(`Failed to download audio: ${error.message}`);
  }
};

// Function to transcribe the audio file
const transcribeAudio = async (audioPath) => {
  try {
    // Upload audio file to AssemblyAI
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      fs.createReadStream(audioPath),
      {
        headers: {
          authorization: process.env.ASSEMBLYAI_API_KEY,
          "Content-Type": "audio/mpeg",
        },
      }
    );

    // Request transcription
    const transcriptResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: uploadResponse.data.upload_url,
      },
      {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      }
    );

    // Poll for transcription completion with timeout
    let transcription;
    let attempts = 0;
    const maxAttempts = 60; // 1 minute timeout

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptResponse.data.id}`,
        {
          headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
        }
      );

      transcription = statusResponse.data;

      if (transcription.status === "completed") break;
      if (transcription.status === "error") {
        throw new Error(`Transcription failed: ${transcription.error}`);
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (attempts >= maxAttempts) {
      throw new Error("Transcription timeout");
    }

    // Clean up the audio file after transcription
    fs.unlink(audioPath, (err) => {
      if (err) console.error(`Failed to delete audio file: ${err}`);
    });

    return transcription.text;
  } catch (error) {
    // Clean up the audio file in case of error
    fs.unlink(audioPath, () => {});
    throw new Error(`Transcription error: ${error.message}`);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
