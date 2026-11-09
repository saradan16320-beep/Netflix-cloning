import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  Lock,
  Unlock,
  HardDriveDownload,
  AlertTriangle,
} from 'lucide-react';
import { saveWatchProgress, getWatchProgress } from '../services/db';

interface VideoPlayerProps {
  title: string;
  subtitle?: string;
  contentId: string;
  episodeId?: string;
  videoSourceUrl: string; // Blob URL or online URL
  posterUrl?: string;
  isOfflinePlayback: boolean;
  onClose: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  title,
  subtitle,
  contentId,
  episodeId,
  videoSourceUrl,
  posterUrl,
  isOfflinePlayback,
  onClose,
  onNextEpisode,
  hasNextEpisode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLocked, setIsLocked] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<'off' | 'id' | 'en'>('id');
  const [activeAudio, setActiveAudio] = useState<'id' | 'en'>('id');
  const [videoError, setVideoError] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<number | null>(null);
  const progressKey = episodeId ? `${contentId}_ep_${episodeId}` : contentId;

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Restore watch progress
  useEffect(() => {
    const restoreProgress = async () => {
      try {
        const saved = await getWatchProgress(progressKey);
        if (saved && saved.currentTime > 5 && videoRef.current) {
          videoRef.current.currentTime = saved.currentTime;
        }
      } catch {
        // ignore
      }
    };
    restoreProgress();
  }, [progressKey]);

  // Periodic watch progress auto-save
  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused && duration > 0) {
        const current = videoRef.current.currentTime;
        await saveWatchProgress({
          id: progressKey,
          contentId,
          episodeId,
          currentTime: current,
          duration,
          progressPercent: Math.round((current / duration) * 100),
          updatedAt: Date.now(),
          title: subtitle ? `${title} (${subtitle})` : title,
          posterUrl: posterUrl || '',
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [contentId, episodeId, progressKey, duration, title, subtitle, posterUrl]);

  // Hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && !isLocked) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowSubMenu(false);
      }
    }, 3500);
  }, [isPlaying, isLocked]);

  useEffect(() => {
    const handleMouseMove = () => resetControlsTimeout();
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  // Skip ±10 seconds
  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + amount));
    resetControlsTimeout();
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) {
        if (e.key === 'l' || e.key === 'L') setIsLocked(false);
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case 'Escape':
          if (!document.fullscreenElement) {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, isLocked, onClose]);

  // Current Subtitle Cue generator for immersion
  const getSimulatedSubtitleText = () => {
    if (activeSubtitle === 'off') return null;
    const sec = Math.floor(currentTime) % 30;
    if (activeSubtitle === 'id') {
      if (sec >= 2 && sec <= 6) return 'Sistem transmisi terdeteksi di koordinat 106.8456...';
      if (sec >= 8 && sec <= 12) return 'Kita tidak memiliki banyak waktu sebelum jaringan terputus sepenuhnya.';
      if (sec >= 14 && sec <= 19) return 'Aktifkan mode penyimpanan offline sekarang juga!';
      if (sec >= 21 && sec <= 26) return 'Semua modul data berhasil dienkripsi ke drive lokal.';
    } else {
      if (sec >= 2 && sec <= 6) return 'Transmission protocol detected at coordinates 106.8456...';
      if (sec >= 8 && sec <= 12) return 'We do not have much time before network isolation.';
      if (sec >= 14 && sec <= 19) return 'Activate the offline storage engine immediately!';
      if (sec >= 21 && sec <= 26) return 'All data blocks have been securely saved to local storage.';
    }
    return null;
  };

  const subtitleText = getSimulatedSubtitleText();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSourceUrl}
        poster={posterUrl}
        autoPlay
        playsInline
        muted={isMuted}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            videoRef.current.playbackRate = playbackSpeed;
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          if (hasNextEpisode && onNextEpisode) {
            onNextEpisode();
          }
        }}
        onError={() => {
          setVideoError('Gagal memuat berkas video. Pastikan izin media didukung pada perangkat ini.');
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Synchronized Subtitle Overlay */}
      {subtitleText && (
        <div className="absolute bottom-20 left-4 right-4 text-center pointer-events-none z-30 transition-all">
          <span className="inline-block px-4 py-1.5 rounded bg-black/80 text-amber-200 text-sm sm:text-lg font-medium tracking-wide shadow-2xl backdrop-blur-xs border border-white/5">
            {subtitleText}
          </span>
        </div>
      )}

      {/* Video Error Message */}
      {videoError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-40 space-y-4">
          <AlertTriangle className="w-12 h-12 text-[#E50914]" />
          <h3 className="text-lg font-bold text-white">Kesalahan Pemutaran Video</h3>
          <p className="text-xs text-neutral-400 max-w-md">{videoError}</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-[#E50914] text-white text-xs font-semibold hover:bg-[#b81d24]"
          >
            Kembali ke Katalog
          </button>
        </div>
      )}

      {/* Lock Button (when UI is locked) */}
      {isLocked && (
        <div className="absolute top-6 left-6 z-40">
          <button
            onClick={() => setIsLocked(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold border border-white/20 transition backdrop-blur-sm cursor-pointer"
          >
            <Unlock className="w-4 h-4 text-[#E50914]" />
            <span>Buka Kunci Layar</span>
          </button>
        </div>
      )}

      {/* Controls Overlay (Fades in/out) */}
      <div
        className={`absolute inset-0 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-black/90 via-transparent to-black/80 pointer-events-none transition-opacity duration-300 z-30 ${
          showControls && !isLocked ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 pointer-events-auto">
          {/* Back Button & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate drop-shadow">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-neutral-300 truncate drop-shadow">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Offline Badge & Lock Screen Button */}
          <div className="flex items-center gap-3">
            {isOfflinePlayback && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-medium shadow-md backdrop-blur-xs">
                <HardDriveDownload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Memutar dari Penyimpanan Offline</span>
                <span className="sm:hidden">Offline</span>
              </div>
            )}

            <button
              onClick={() => setIsLocked(true)}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 transition cursor-pointer"
              title="Kunci Kontrol Layar"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Play/Pause Pulsing Indicator */}
        <div className="flex items-center justify-center gap-8 pointer-events-auto">
          <button
            onClick={() => skipTime(-10)}
            className="p-3 rounded-full hover:bg-white/15 text-white transition active:scale-90 cursor-pointer"
            title="Mundur 10 detik"
          >
            <RotateCcw className="w-7 h-7 sm:w-9 sm:h-9" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm border border-white/30 transition transform hover:scale-105 active:scale-95 shadow-2xl cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white" />
            ) : (
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
            )}
          </button>

          <button
            onClick={() => skipTime(10)}
            className="p-3 rounded-full hover:bg-white/15 text-white transition active:scale-90 cursor-pointer"
            title="Maju 10 detik"
          >
            <RotateCw className="w-7 h-7 sm:w-9 sm:h-9" />
          </button>
        </div>

        {/* Bottom Scrubber & Controls Bar */}
        <div className="space-y-3 pointer-events-auto">
          {/* Timeline Range Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-neutral-300 w-12 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 group/scrub">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full h-1.5 bg-neutral-700/80 hover:h-2.5 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none"
              />
            </div>

            <span className="text-xs font-mono text-neutral-400 w-12">
              -{formatTime(Math.max(0, duration - currentTime))}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls: Play, Skip, Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => skipTime(10)}
                className="p-2 hover:bg-white/10 rounded-full text-white transition cursor-pointer hidden sm:block"
                title="Maju 10 detik"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-2 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                    if (videoRef.current) {
                      videoRef.current.volume = val;
                      videoRef.current.muted = val === 0;
                    }
                  }}
                  className="w-16 sm:w-20 h-1 bg-neutral-600 rounded-lg appearance-none cursor-pointer hidden group-hover/vol:block transition-all"
                />
              </div>

              {/* Title indicator for wide screens */}
              <span className="hidden lg:inline text-xs text-neutral-400 border-l border-neutral-700 pl-3">
                {title} {subtitle ? `· ${subtitle}` : ''}
              </span>
            </div>

            {/* Right Controls: Subtitles, Speed, Next Episode, Fullscreen */}
            <div className="flex items-center gap-2 relative">
              {/* Next Episode button */}
              {hasNextEpisode && onNextEpisode && (
                <button
                  onClick={onNextEpisode}
                  className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition cursor-pointer mr-2"
                >
                  Episode Berikutnya
                </button>
              )}

              {/* Subtitles & Audio Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSubMenu((prev) => !prev);
                    setShowSpeedMenu(false);
                  }}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    activeSubtitle !== 'off' ? 'text-[#E50914]' : 'text-white hover:bg-white/10'
                  }`}
                  title="Audio & Subtitle"
                >
                  <Subtitles className="w-5 h-5" />
                </button>

                {/* Subtitle Selector Dropdown */}
                {showSubMenu && (
                  <div className="absolute bottom-12 right-0 w-64 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl space-y-3 z-50 text-xs text-white">
                    <div>
                      <h4 className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider mb-1.5">
                        Audio
                      </h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => setActiveAudio('id')}
                          className={`w-full text-left px-2.5 py-1 rounded flex items-center justify-between ${
                            activeAudio === 'id' ? 'bg-[#E50914] text-white font-bold' : 'hover:bg-neutral-800'
                          }`}
                        >
                          <span>Bahasa Indonesia (Asli 5.1)</span>
                        </button>
                        <button
                          onClick={() => setActiveAudio('en')}
                          className={`w-full text-left px-2.5 py-1 rounded flex items-center justify-between ${
                            activeAudio === 'en' ? 'bg-[#E50914] text-white font-bold' : 'hover:bg-neutral-800'
                          }`}
                        >
                          <span>English (Dolby Atmos)</span>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-2">
                      <h4 className="font-bold text-neutral-400 text-[11px] uppercase tracking-wider mb-1.5">
                        Teks Terjemahan (Subtitles)
                      </h4>
                      <div className="space-y-1">
                        <button
                          onClick={() => setActiveSubtitle('id')}
                          className={`w-full text-left px-2.5 py-1 rounded flex items-center justify-between ${
                            activeSubtitle === 'id' ? 'bg-[#E50914] text-white font-bold' : 'hover:bg-neutral-800'
                          }`}
                        >
                          <span>Bahasa Indonesia [CC]</span>
                        </button>
                        <button
                          onClick={() => setActiveSubtitle('en')}
                          className={`w-full text-left px-2.5 py-1 rounded flex items-center justify-between ${
                            activeSubtitle === 'en' ? 'bg-[#E50914] text-white font-bold' : 'hover:bg-neutral-800'
                          }`}
                        >
                          <span>English [CC]</span>
                        </button>
                        <button
                          onClick={() => setActiveSubtitle('off')}
                          className={`w-full text-left px-2.5 py-1 rounded flex items-center justify-between ${
                            activeSubtitle === 'off' ? 'bg-neutral-800 text-neutral-300 font-bold' : 'hover:bg-neutral-800'
                          }`}
                        >
                          <span>Nonaktif</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Playback Speed Menu Trigger */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu((prev) => !prev);
                    setShowSubMenu(false);
                  }}
                  className="px-2 py-1 rounded hover:bg-white/10 text-white text-xs font-bold transition cursor-pointer"
                  title="Kecepatan Pemutaran"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-12 right-0 w-32 bg-neutral-900 border border-neutral-700 rounded-xl p-2 shadow-2xl space-y-1 z-50 text-xs">
                    {[0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          if (videoRef.current) videoRef.current.playbackRate = speed;
                          setShowSpeedMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded transition ${
                          playbackSpeed === speed
                            ? 'bg-[#E50914] text-white font-bold'
                            : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        {speed === 1 ? '1x (Normal)' : `${speed}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
