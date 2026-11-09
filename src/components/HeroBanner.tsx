import React from 'react';
import { Play, Download, Check, Info, AlertCircle, Loader2 } from 'lucide-react';
import { Movie, DownloadItem } from '../types';

interface HeroBannerProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onStartDownload: (movie: Movie) => void;
  downloadStatus?: DownloadItem;
  isOnline: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onPlay,
  onOpenDetails,
  onStartDownload,
  downloadStatus,
  isOnline,
}) => {
  const isDownloaded = downloadStatus?.status === 'completed';
  const isDownloading = downloadStatus?.status === 'downloading' || downloadStatus?.status === 'pending';

  return (
    <div className="relative w-full h-[75vh] min-h-[500px] max-h-[720px] overflow-hidden select-none">
      {/* Background Backdrop Image */}
      <img
        src={movie.backdropUrl}
        alt={movie.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.7]"
      />

      {/* Cinematic Vignette Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/30 to-transparent" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 pt-24 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Category */}
          {movie.badge && (
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#E50914] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#E50914]" />
              <span>{movie.badge}</span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {movie.title}
          </h1>

          {/* Unboxed Metadata (Rule: No static pill enclosures) */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
            <span className="text-emerald-400 font-bold">{movie.matchPercentage}% Cocok</span>
            <span aria-hidden="true">·</span>
            <span>{movie.year}</span>
            <span aria-hidden="true">·</span>
            <span className="border border-neutral-600 px-1 py-0.5 rounded text-[10px] leading-none text-neutral-300">
              {movie.ageRating}
            </span>
            <span aria-hidden="true">·</span>
            <span>{movie.duration}</span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-400">{movie.genre.slice(0, 2).join(', ')}</span>
            {isDownloaded && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Tersimpan Offline
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed line-clamp-3 max-w-xl drop-shadow">
            {movie.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Play Button */}
            <button
              onClick={() => onPlay(movie)}
              disabled={!isOnline && !isDownloaded}
              className={`flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm transition-all shadow-md cursor-pointer ${
                !isOnline && !isDownloaded
                  ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-60'
                  : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
              }`}
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Putar Film</span>
            </button>

            {/* Download Button */}
            {movie.type === 'movie' && (
              <button
                onClick={() => onStartDownload(movie)}
                disabled={isDownloaded || isDownloading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-all border cursor-pointer ${
                  isDownloaded
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : isDownloading
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300 cursor-wait'
                    : !isOnline
                    ? 'bg-neutral-800/60 border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-600 text-white active:scale-95'
                }`}
                title={
                  isDownloaded
                    ? 'Sudah diunduh dan tersimpan di penyimpanan perangkat'
                    : !isOnline
                    ? 'Perlu koneksi internet untuk mengunduh'
                    : 'Unduh untuk ditonton tanpa internet'
                }
              >
                {isDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tersimpan ({((movie.fileSizeBytes || 0) / (1024 * 1024)).toFixed(0)} MB)</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
                    <span>Mengunduh {downloadStatus?.progress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh ({((movie.fileSizeBytes || 0) / (1024 * 1024)).toFixed(0)} MB)</span>
                  </>
                )}
              </button>
            )}

            {/* Details Modal Button */}
            <button
              onClick={() => onOpenDetails(movie)}
              className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm bg-neutral-600/70 hover:bg-neutral-600 text-white transition-all backdrop-blur-sm border border-white/10 active:scale-95 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Selengkapnya</span>
            </button>
          </div>

          {/* Offline warning notice if not online and not downloaded */}
          {!isOnline && !isDownloaded && (
            <div className="flex items-center gap-2 text-xs text-amber-400/90 pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Perangkat dalam mode offline. Hanya konten yang tersimpan yang dapat diputar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
