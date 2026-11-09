import React from 'react';
import { X, Play, Download, Check, Loader2, Plus, CheckCheck, AlertCircle } from 'lucide-react';
import { Movie, Episode, DownloadItem } from '../types';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  onPlayMovie: (movie: Movie) => void;
  onPlayEpisode: (movie: Movie, episode: Episode) => void;
  onStartMovieDownload: (movie: Movie) => void;
  onStartEpisodeDownload: (movie: Movie, episode: Episode) => void;
  downloadsMap: Map<string, DownloadItem>;
  isOnline: boolean;
  isSavedInMyList?: boolean;
  onToggleMyList?: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  onPlayMovie,
  onPlayEpisode,
  onStartMovieDownload,
  onStartEpisodeDownload,
  downloadsMap,
  isOnline,
  isSavedInMyList,
  onToggleMyList,
}) => {
  if (!movie) return null;

  const movieDownload = downloadsMap.get(movie.id);
  const isMovieDownloaded = movieDownload?.status === 'completed';
  const isMovieDownloading = movieDownload?.status === 'downloading' || movieDownload?.status === 'pending';
  const canPlayMovie = isOnline || isMovieDownloaded;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#181818] rounded-xl overflow-hidden shadow-2xl border border-neutral-800 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Hero Backdrop */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-neutral-950">
          <img
            src={movie.backdropUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent" />

          {/* Action Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center gap-3">
            {movie.type === 'movie' ? (
              <button
                onClick={() => onPlayMovie(movie)}
                disabled={!canPlayMovie}
                className={`flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm shadow-lg transition-all cursor-pointer ${
                  !canPlayMovie
                    ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-60'
                    : 'bg-white text-black hover:bg-neutral-200 active:scale-95'
                }`}
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Putar Film</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (movie.episodes && movie.episodes.length > 0) {
                    onPlayEpisode(movie, movie.episodes[0]);
                  }
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Putar Episode 1</span>
              </button>
            )}

            {/* Movie Download Action */}
            {movie.type === 'movie' && (
              <button
                onClick={() => onStartMovieDownload(movie)}
                disabled={isMovieDownloaded || isMovieDownloading || !isOnline}
                className={`flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm transition-all border cursor-pointer ${
                  isMovieDownloaded
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                    : isMovieDownloading
                    ? 'bg-neutral-800 border-neutral-700 text-neutral-300 cursor-wait'
                    : !isOnline
                    ? 'bg-neutral-800/40 border-neutral-700 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-600 text-white active:scale-95'
                }`}
              >
                {isMovieDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Tersimpan Offline</span>
                  </>
                ) : isMovieDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E50914]" />
                    <span>Mengunduh {movieDownload?.progress}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Unduh ({((movie.fileSizeBytes || 0) / (1024 * 1024)).toFixed(0)} MB)</span>
                  </>
                )}
              </button>
            )}

            {/* My List Bookmark */}
            {onToggleMyList && (
              <button
                onClick={() => onToggleMyList(movie)}
                className="flex items-center gap-2 px-4 py-2.5 rounded font-semibold text-sm bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-600 text-white transition-all cursor-pointer"
              >
                {isSavedInMyList ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span>Dalam Daftar</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Daftar Saya</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              {/* Unboxed Metadata (Rule: No static pill enclosures) */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-300">
                <span className="text-emerald-400 font-bold">{movie.matchPercentage}% Cocok</span>
                <span aria-hidden="true">·</span>
                <span>{movie.year}</span>
                <span aria-hidden="true">·</span>
                <span className="border border-neutral-600 px-1.5 py-0.5 rounded text-xs leading-none text-neutral-300">
                  {movie.ageRating}
                </span>
                <span aria-hidden="true">·</span>
                <span>{movie.duration}</span>
                <span aria-hidden="true">·</span>
                <span className="border border-neutral-700 px-1 text-[11px] rounded text-neutral-400">HD / Ultra HD</span>
              </div>

              {/* Tagline */}
              {movie.tagline && (
                <p className="text-sm italic text-neutral-400 font-medium">
                  "{movie.tagline}"
                </p>
              )}

              {/* Synopsis */}
              <p className="text-sm text-neutral-300 leading-relaxed">
                {movie.description}
              </p>

              {/* Offline availability notice */}
              {!isOnline && !isMovieDownloaded && movie.type === 'movie' && (
                <div className="flex items-center gap-2 p-3 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Anda sedang offline. Film ini belum disimpan. Hubungkan perangkat Anda ke Wi-Fi/Internet untuk mengunduhnya ke penyimpanan lokal.
                  </span>
                </div>
              )}
            </div>

            {/* Cast & Director sidebar */}
            <div className="w-full md:w-64 space-y-2 text-xs text-neutral-400 border-t md:border-t-0 md:border-l border-neutral-800 md:pl-6 pt-4 md:pt-0">
              <div>
                <span className="text-neutral-500">Pemeran: </span>
                <span className="text-neutral-300">{movie.cast.join(', ')}</span>
              </div>
              <div>
                <span className="text-neutral-500">Sutradara: </span>
                <span className="text-neutral-300">{movie.director}</span>
              </div>
              <div>
                <span className="text-neutral-500">Genre: </span>
                <span className="text-neutral-300">{movie.genre.join(', ')}</span>
              </div>
              <div>
                <span className="text-neutral-500">Audio & Subtitle: </span>
                <span className="text-neutral-300">Bahasa Indonesia, English [CC]</span>
              </div>
            </div>
          </div>

          {/* If Series: Episodes List with Individual Download Buttons */}
          {movie.type === 'series' && movie.episodes && (
            <div className="border-t border-neutral-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-white">Episode</h4>
                <span className="text-xs text-neutral-400">Musim 1 ({movie.episodes.length} Episode)</span>
              </div>

              <div className="space-y-3">
                {movie.episodes.map((episode) => {
                  const epKey = `${movie.id}_ep_${episode.id}`;
                  const epDownload = downloadsMap.get(epKey);
                  const isEpDownloaded = epDownload?.status === 'completed';
                  const isEpDownloading = epDownload?.status === 'downloading' || epDownload?.status === 'pending';
                  const canPlayEp = isOnline || isEpDownloaded;

                  return (
                    <div
                      key={episode.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-neutral-900/60 hover:bg-neutral-800/80 transition-all border border-neutral-800/80"
                    >
                      {/* Left: Number, Thumbnail, Title & Overview */}
                      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                        <span className="text-base font-bold text-neutral-500 w-6 text-center shrink-0">
                          {episode.episodeNumber}
                        </span>

                        {/* Thumbnail */}
                        <div
                          onClick={() => canPlayEp && onPlayEpisode(movie, episode)}
                          className={`relative aspect-[16/10] w-28 sm:w-32 rounded overflow-hidden bg-neutral-950 shrink-0 cursor-pointer ${
                            !canPlayEp ? 'opacity-50' : ''
                          }`}
                        >
                          <img
                            src={episode.thumbnail}
                            alt={episode.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            {canPlayEp ? (
                              <div className="w-8 h-8 rounded-full bg-black/70 flex items-center justify-center border border-white/20">
                                <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                              </div>
                            ) : (
                              <span className="text-[9px] bg-black/80 text-amber-400 px-1 py-0.5 rounded">
                                Offline
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text detail */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-baseline gap-2">
                            <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                              {episode.title}
                            </h5>
                            <span className="text-[11px] text-neutral-400 shrink-0">
                              {episode.duration}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {episode.overview}
                          </p>
                        </div>
                      </div>

                      {/* Right: Individual Episode Download Button */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => onStartEpisodeDownload(movie, episode)}
                          disabled={isEpDownloaded || isEpDownloading || !isOnline}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-all cursor-pointer ${
                            isEpDownloaded
                              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-400'
                              : isEpDownloading
                              ? 'border-neutral-700 bg-neutral-800 text-neutral-300 cursor-wait'
                              : !isOnline
                              ? 'border-neutral-800 bg-neutral-900 text-neutral-600 cursor-not-allowed'
                              : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-500 active:scale-95'
                          }`}
                          title={
                            isEpDownloaded
                              ? 'Episode ini tersimpan di offline'
                              : isEpDownloading
                              ? 'Sedang mengunduh episode'
                              : !isOnline
                              ? 'Perlu koneksi internet untuk mengunduh'
                              : 'Unduh episode ini'
                          }
                        >
                          {isEpDownloaded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Tersimpan</span>
                            </>
                          ) : isEpDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E50914]" />
                              <span>{epDownload?.progress}%</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Unduh ({((episode.fileSizeBytes || 0) / (1024 * 1024)).toFixed(0)} MB)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
