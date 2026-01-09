import { Routes } from '@angular/router';
import { VideoDownloaderComponent } from './components/video-downloader/video-downloader.component';
import { YoutubeViewerComponent } from './components/youtube-viewer/youtube-viewer.component';

export const routes: Routes = [
  { path: '', redirectTo: '/downloader', pathMatch: 'full' },
  { path: 'downloader', component: VideoDownloaderComponent },
  { path: 'viewer', component: YoutubeViewerComponent },
];
