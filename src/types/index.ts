export type MediaType = 'movie' | 'series';

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  duration: string;
  durationSec: number;
  overview: string;
  thumbnail: string;
  videoUrl: string;
  fileSizeBytes: number; // approximate size
}

export interface Movie {
  id: string;
  title: string;
  type: MediaType;
  tagline: string;
  description: string;
  year: number;
  ageRating: string; // '18+', '16+', '13+', 'SU'
  matchPercentage: number;
  duration: string;
  genre: string[];
  cast: string[];
  director: string;
  badge?: string; // 'Paling Populer', 'Baru Rilis', 'Netflix Original'
  backdropUrl: string;
  posterUrl: string;
  videoUrl: string; // for movies
  fileSizeBytes: number; // for movies (e.g. 45000000 = ~45MB)
  episodes?: Episode[]; // for series
  availableOffline: boolean;
}

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'paused' | 'failed';

export interface DownloadItem {
  id: string; // item key (e.g. movie-1 or series-1-ep-1)
  contentId: string; // parent movie id
  episodeId?: string; // episode id if tv show
  title: string;
  subtitle?: string; // e.g. "Musim 1: Episode 2"
  type: MediaType;
  posterUrl: string;
  backdropUrl: string;
  quality: 'standard' | 'high';
  fileSizeBytes: number;
  downloadedBytes: number;
  progress: number; // 0 - 100
  status: DownloadStatus;
  downloadSpeed?: string; // e.g. "3.8 MB/s"
  createdAt: number;
  completedAt?: number;
  videoBlob?: Blob; // stored in IndexedDB
  videoBlobUrl?: string; // created via URL.createObjectURL
  isCustomUpload?: boolean;
}

export interface WatchProgress {
  id: string; // contentId or episodeId
  contentId: string;
  episodeId?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  updatedAt: number;
  title: string;
  posterUrl: string;
}

export interface UserSettings {
  downloadQuality: 'standard' | 'high';
  smartDownloads: boolean; // Auto-delete watched, download next
  wifiOnly: boolean;
  autoPlayNext: boolean;
  storageLimitMB: number;
}
