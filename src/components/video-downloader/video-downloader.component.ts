import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface Download {
  eta?: number;
  speed?: number;
  id: number;
  url: string;
  format: string;
  progress: number;
  status: 'downloading' | 'completed' | 'failed';
  fileName: string;
}

@Component({
  selector: 'app-video-downloader',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressBarModule],
  templateUrl: './video-downloader.component.html',
  styleUrls: ['./video-downloader.component.css'],
})
export class VideoDownloaderComponent {
  url: string = '';
  format: string = 'mp4';
  downloads: Download[] = [];
  nextId: number = 1;
  socket!: Socket;

  startDownload() {
    if (!this.url.trim()) {
      return;
    }

    const fileName = this.extractFileName(this.url);
    const download: Download = {
      id: this.nextId++,
      url: this.url,
      format: this.format,
      progress: 0,
      status: 'downloading',
      fileName: `${fileName}.${this.format}`,
    };

    this.downloads.unshift(download);
    this.downloadVideo(download);
    this.url = '';
  }

  private extractFileName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart || 'video';
    } catch {
      return 'video';
    }
  }

  ngOnInit() {
    this.socket = io('http://localhost:3000');

    this.socket.on('download-progress', (data: { downloadId: number; content: string }) => {
      // Ici "data.content" est la ligne brute
      const raw = data.content as string;

      // Extraire l'objet JSON
      const match = raw.match(/\{.*\}/);
      if (!match) return;

      const progressObj = JSON.parse(match[0]);

      // Trouver le download correspondant
      const download = this.downloads.find(d => d.id === data.downloadId);
      if (download) {
        console.log(download);
        download.progress = parseFloat(progressObj.status === 'finished' ? '100' : progressObj._percent || '0');
        download.speed = parseFloat(progressObj.speed) || 0;
        download.eta = parseFloat(progressObj.eta) || 0;
        download.status = progressObj.status === 'finished' ? 'completed' : 'downloading';
      }
    });
  }

  downloadVideo(download: Download) {
    this.socket.emit(
      'start-download',
      { url: download.url, format: download.format, id: download.id }
    );
    this.socket.on(`download-complete-${download.id}`, () => {
      download.status = 'completed';
      download.progress = 100;
    });
    this.socket.on(`download-failed-${download.id}`, () => {
      download.status = 'failed';
    });
  } 
  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getProgressColor(status: string): string {
    if (status === 'completed') return '#10b981';
    if (status === 'failed') return '#ef4444';
    return '#3b82f6';
  }
}
