from django.contrib import admin
from django.urls import path
from django.urls import include, path
from core import urls as core_urls


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(core_urls)),
]
