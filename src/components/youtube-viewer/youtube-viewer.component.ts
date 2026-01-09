import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Video {
  id: string;
  url: string;
  embedUrl: SafeResourceUrl;
  title: string;
  addedAt: Date;
}

@Component({
  selector: 'app-youtube-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './youtube-viewer.component.html',
  styleUrls: ['./youtube-viewer.component.css'],
})
export class YoutubeViewerComponent {
  videoUrl: string = '';
  currentVideo: Video | null = null;
  videoHistory: Video[] = [];
  errorMessage: string = '';

  constructor(private sanitizer: DomSanitizer) {}

  loadVideo() {
    this.errorMessage = '';

    if (!this.videoUrl.trim()) {
      this.errorMessage = 'Please enter a YouTube URL';
      return;
    }

    const videoId = this.extractVideoId(this.videoUrl);

    if (!videoId) {
      this.errorMessage = 'Invalid YouTube URL. Please enter a valid YouTube link.';
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);

    this.currentVideo = {
      id: videoId,
      url: this.videoUrl,
      embedUrl: safeUrl,
      title: `Video ${videoId}`,
      addedAt: new Date(),
    };

    const existingIndex = this.videoHistory.findIndex((v) => v.id === videoId);
    if (existingIndex >= 0) {
      this.videoHistory.splice(existingIndex, 1);
    }

    this.videoHistory.unshift({
      ...this.currentVideo,
      embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${videoId}`
      ),
    });

    if (this.videoHistory.length > 10) {
      this.videoHistory.pop();
    }

    this.videoUrl = '';
  }

  loadFromHistory(video: Video) {
    const embedUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
    this.currentVideo = {
      ...video,
      embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl),
    };

    const existingIndex = this.videoHistory.findIndex((v) => v.id === video.id);
    if (existingIndex >= 0) {
      this.videoHistory.splice(existingIndex, 1);
      this.videoHistory.unshift(video);
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    return null;
  }

  getThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }

  clearHistory() {
    this.videoHistory = [];
  }
}
