# WriteItUp.ai

WriteItUp.ai is a web application that automatically generates blog posts from YouTube videos. It downloads the audio from a YouTube video, transcribes it using AssemblyAI, and then uses OpenAI's language model via Langchain to create a well-structured blog post.

## Features

- YouTube video to blog post conversion
- Automatic audio extraction
- High-quality transcription using AssemblyAI
- AI-powered blog post generation using OpenAI and Langchain
- Modern, responsive web interface
- Copy-to-clipboard functionality

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- AssemblyAI API key

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/writeitup.git
cd writeitup
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
```

4. Replace the API keys in the `.env` file with your actual API keys from:

- OpenAI: https://platform.openai.com/
- AssemblyAI: https://www.assemblyai.com/

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to:

```
http://localhost:5000
```

## Usage

1. Enter a valid YouTube URL in the input field
2. Click "Generate Blog Post"
3. Wait for the processing to complete
4. The generated blog post will appear below
5. Use the "Copy to Clipboard" button to copy the blog post

## Project Structure

- `index.html` - Main frontend interface
- `src/server.js` - Express server and API endpoints
- `package.json` - Project dependencies and scripts

## Error Handling

The application includes comprehensive error handling for:

- Invalid YouTube URLs
- Missing API keys
- Transcription failures
- Network issues
- Server errors

## Development

To run the application in development mode with hot reloading:

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC License
