import React from 'react';
import { Play, Download, Check, Info, Loader2, Plus, CheckCheck } from 'lucide-react';
import { Movie, DownloadItem } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onStartDownload: (movie: Movie) => void;
  downloadStatus?: DownloadItem;
  isOnline: boolean;
  isSavedInMyList?: boolean;
  onToggleMyList?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPlay,
  onOpenDetails,
  onStartDownload,
  downloadStatus,
  isOnline,
  isSavedInMyList,
  onToggleMyList,
}) => {
  const isDownloaded = downloadStatus?.status === 'completed';
  const isDownloading = downloadStatus?.status === 'downloading' || downloadStatus?.status === 'pending';
  const canPlay = isOnline || isDownloaded;

  return (
    <div className="group relative flex-none w-[170px] sm:w-[210px] md:w-[240px] rounded-md overflow-hidden bg-neutral-900 border border-neutral-800 transition-all duration-300 hover:scale-[1.04] hover:z-20 hover:shadow-2xl hover:border-neutral-700">
      {/* Poster Image Container */}
      <div className="relative aspect-[16/10] w-full bg-neutral-950 overflow-hidden">
        <img
          src={movie.backdropUrl || movie.posterUrl}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            !canPlay ? 'opacity-40 grayscale-[30%]' : 'opacity-90'
          }`}
        />

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

        {/* Status Badges on Top */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          {movie.badge ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#E50914] px-1.5 py-0.5 rounded shadow">
              {movie.badge}
            </span>
          ) : <span />}

          {/* Downloaded or Offline Status Indicator */}
          {isDownloaded ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-neutral-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded shadow">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Offline</span>
            </span>
          ) : !isOnline ? (
            <span className="text-[10px] font-medium text-amber-400 bg-neutral-950/90 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Perlu Online
            </span>
          ) : null}
        </div>

        {/* Active Downloading Progress Bar Overlay */}
        {isDownloading && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1.5 border-t border-neutral-700">
            <div className="flex items-center justify-between text-[10px] text-neutral-300 mb-1">
              <span className="flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin text-[#E50914]" />
                <span>Mengunduh...</span>
              </span>
              <span>{downloadStatus?.progress}%</span>
            </div>
            <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#E50914] transition-all duration-300"
                style={{ width: `${downloadStatus?.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Content & Hover Controls */}
      <div className="p-3 space-y-2 bg-neutral-900">
        {/* Title */}
        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-neutral-100">
          {movie.title}
        </h4>

        {/* Unboxed Metadata */}
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <span className="text-emerald-400 font-bold">{movie.matchPercentage}%</span>
          <span aria-hidden="true">·</span>
          <span>{movie.duration}</span>
          <span aria-hidden="true">·</span>
          <span className="border border-neutral-700 px-1 text-[9px] rounded text-neutral-400">
            {movie.ageRating}
          </span>
        </div>

        {/* Genres */}
        <p className="text-[10px] text-neutral-400 truncate">
          {movie.genre.slice(0, 2).join(' · ')}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5">
            {/* Play Button */}
            <button
              onClick={() => onPlay(movie)}
              disabled={!canPlay}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                !canPlay
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-neutral-200 active:scale-95 shadow'
              }`}
              title={canPlay ? 'Putar' : 'Tidak tersedia offline'}
            >
              <Play className="w-3.5 h-3.5 fill-black" />
            </button>

            {/* Quick Download Button (for movies) */}
            {movie.type === 'movie' && (
              <button
                onClick={() => onStartDownload(movie)}
                disabled={isDownloaded || isDownloading || !isOnline}
                className={`p-1.5 rounded-full border transition-all cursor-pointer ${
                  isDownloaded
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
                    : isDownloading
                    ? 'border-neutral-700 bg-neutral-800 text-neutral-400'
                    : !isOnline
                    ? 'border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed'
                    : 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-500 active:scale-95'
                }`}
                title={
                  isDownloaded
                    ? 'Tersimpan di offline'
                    : isDownloading
                    ? 'Sedang mengunduh'
                    : !isOnline
                    ? 'Perlu koneksi online untuk mengunduh'
                    : 'Unduh ke perangkat'
                }
              >
                {isDownloaded ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E50914]" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Bookmark / My List */}
            {onToggleMyList && (
              <button
                onClick={() => onToggleMyList(movie)}
                className="p-1.5 rounded-full border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-500 transition-all cursor-pointer"
                title={isSavedInMyList ? 'Hapus dari Daftar Saya' : 'Tambah ke Daftar Saya'}
              >
                {isSavedInMyList ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          {/* Info Details Trigger */}
          <button
            onClick={() => onOpenDetails(movie)}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Lihat detail lengkap & daftar episode"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
