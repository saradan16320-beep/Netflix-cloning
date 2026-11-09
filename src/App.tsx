import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieRow } from './components/MovieRow';
import { MovieModal } from './components/MovieModal';
import { DownloadsView } from './components/DownloadsView';
import { VideoPlayer } from './components/VideoPlayer';
import { StorageModal } from './components/StorageModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MOVIES_DATA, CATEGORIES } from './data/mockMovies';
import { Movie, Episode, DownloadItem, UserSettings, WatchProgress } from './types';
import { downloadManager } from './services/downloadManager';
import {
  getStorageUsage,
  getSettings,
  saveSettings,
  clearAllDownloads,
  getMyList,
  toggleMyList,
  getAllWatchProgress,
} from './services/db';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { HardDriveDownload, AlertCircle, Play, Film, CheckCircle2 } from 'lucide-react';

export default function App() {
  const { isOnline, isPhysicalOnline, isSimulatedOffline, toggleSimulatedOffline } = useNetworkStatus();

  // App navigation & filters
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & player
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [activePlayer, setActivePlayer] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    contentId: string;
    episodeId?: string;
    videoSourceUrl: string;
    posterUrl?: string;
    isOfflinePlayback: boolean;
    onNextEpisode?: () => void;
    hasNextEpisode?: boolean;
  } | null>(null);

  // Downloads & Storage state
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [storageUsage, setStorageUsage] = useState({
    usedBytes: 0,
    quotaBytes: 10 * 1024 * 1024 * 1024,
    downloadsCount: 0,
  });
  const [settings, setSettings] = useState<UserSettings>({
    downloadQuality: 'standard',
    smartDownloads: true,
    wifiOnly: false,
    autoPlayNext: true,
    storageLimitMB: 5000,
  });
  const [myListIds, setMyListIds] = useState<Set<string>>(new Set());
  const [watchProgressList, setWatchProgressList] = useState<WatchProgress[]>([]);

  // Subscribe to download manager updates
  useEffect(() => {
    const unsubscribe = downloadManager.subscribe((items) => {
      setDownloads(items);
      refreshStorage();
    });
    return () => unsubscribe();
  }, []);

  // Initial load
  const refreshStorage = useCallback(async () => {
    const usage = await getStorageUsage();
    setStorageUsage(usage);
  }, []);

  const refreshMyList = useCallback(async () => {
    const list = await getMyList();
    setMyListIds(new Set(list));
  }, []);

  const refreshWatchProgress = useCallback(async () => {
    const list = await getAllWatchProgress();
    setWatchProgressList(list.sort((a, b) => b.updatedAt - a.updatedAt));
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedSettings = await getSettings();
      setSettings(savedSettings);
      await refreshStorage();
      await refreshMyList();
      await refreshWatchProgress();

      // First time onboarding: If zero downloads, start one quick sample download
      // so the user immediately has an offline-ready film to test!
      const currentDownloads = downloadManager.getDownloads();
      if (currentDownloads.length === 0) {
        const sampleMovie = MOVIES_DATA[1]; // Krakatoa
        if (sampleMovie) {
          downloadManager.startDownload(sampleMovie, undefined, 'standard');
        }
      }
    };
    init();
  }, [refreshStorage, refreshMyList, refreshWatchProgress]);

  // Fast map lookup for downloads
  const downloadsMap = useMemo(() => {
    const map = new Map<string, DownloadItem>();
    downloads.forEach((d) => map.set(d.id, d));
    return map;
  }, [downloads]);

  // Featured hero movie
  const featuredMovie = MOVIES_DATA[0];

  // Play a movie (checks offline blob first, then online source)
  const handlePlayMovie = (movie: Movie) => {
    const dl = downloadsMap.get(movie.id);
    const isDownloaded = dl && dl.status === 'completed';

    if (!isOnline && !isDownloaded) {
      alert('Film ini belum diunduh ke penyimpanan offline. Hubungkan ke internet untuk memutar atau mengunduhnya.');
      return;
    }

    const videoSource = isDownloaded && dl?.videoBlobUrl ? dl.videoBlobUrl : movie.videoUrl;

    setActivePlayer({
      isOpen: true,
      title: movie.title,
      contentId: movie.id,
      videoSourceUrl: videoSource,
      posterUrl: movie.backdropUrl,
      isOfflinePlayback: !!(isDownloaded && dl?.videoBlobUrl),
    });
  };

  // Play an episode
  const handlePlayEpisode = (movie: Movie, episode: Episode) => {
    const epKey = `${movie.id}_ep_${episode.id}`;
    const dl = downloadsMap.get(epKey);
    const isDownloaded = dl && dl.status === 'completed';

    if (!isOnline && !isDownloaded) {
      alert('Episode ini belum diunduh ke penyimpanan offline. Hubungkan ke internet untuk memutar atau mengunduhnya.');
      return;
    }

    const videoSource = isDownloaded && dl?.videoBlobUrl ? dl.videoBlobUrl : episode.videoUrl;

    // Check next episode
    const currentIndex = movie.episodes?.findIndex((e) => e.id === episode.id) ?? -1;
    const hasNext = movie.episodes && currentIndex >= 0 && currentIndex < movie.episodes.length - 1;
    const nextEp = hasNext && movie.episodes ? movie.episodes[currentIndex + 1] : undefined;

    setActivePlayer({
      isOpen: true,
      title: movie.title,
      subtitle: `Musim ${episode.seasonNumber} · Ep ${episode.episodeNumber}: ${episode.title}`,
      contentId: movie.id,
      episodeId: episode.id,
      videoSourceUrl: videoSource,
      posterUrl: episode.thumbnail || movie.backdropUrl,
      isOfflinePlayback: !!(isDownloaded && dl?.videoBlobUrl),
      hasNextEpisode: !!hasNext,
      onNextEpisode: nextEp ? () => handlePlayEpisode(movie, nextEp) : undefined,
    });
  };

  // Play directly from DownloadsView
  const handlePlayDownload = (item: DownloadItem) => {
    const videoSource = item.videoBlobUrl || '';
    setActivePlayer({
      isOpen: true,
      title: item.title,
      subtitle: item.subtitle,
      contentId: item.contentId,
      episodeId: item.episodeId,
      videoSourceUrl: videoSource,
      posterUrl: item.backdropUrl || item.posterUrl,
      isOfflinePlayback: true,
    });
  };

  // Start movie download
  const handleStartMovieDownload = async (movie: Movie) => {
    if (!isOnline) {
      alert('Anda sedang offline. Hubungkan perangkat ke internet untuk mengunduh film.');
      return;
    }
    await downloadManager.startDownload(movie, undefined, settings.downloadQuality);
    await refreshStorage();
  };

  // Start episode download
  const handleStartEpisodeDownload = async (movie: Movie, episode: Episode) => {
    if (!isOnline) {
      alert('Anda sedang offline. Hubungkan perangkat ke internet untuk mengunduh episode.');
      return;
    }
    await downloadManager.startDownload(movie, episode, settings.downloadQuality);
    await refreshStorage();
  };

  // My List toggle
  const handleToggleMyList = async (movie: Movie) => {
    await toggleMyList(movie.id);
    await refreshMyList();
  };

  // Storage Settings actions
  const handleSaveSettings = async (newSettings: UserSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleClearAllDownloads = async () => {
    await clearAllDownloads();
    await downloadManager.refreshDownloads();
    await refreshStorage();
  };

  // Custom user video import
  const handleImportCustomVideo = async (file: File, title: string) => {
    const imported = await downloadManager.importCustomVideo(file, title);
    await refreshStorage();
    setActiveTab('downloads');
    // Optional: immediate play
    handlePlayDownload(imported);
  };

  // Filter movies according to active tab or search
  const filteredMovies = useMemo(() => {
    let result = MOVIES_DATA;

    if (activeTab === 'series') {
      result = result.filter((m) => m.type === 'series');
    } else if (activeTab === 'movies') {
      result = result.filter((m) => m.type === 'movie');
    } else if (activeTab === 'my-list') {
      result = result.filter((m) => myListIds.has(m.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.genre.some((g) => g.toLowerCase().includes(q)) ||
          m.cast.some((c) => c.toLowerCase().includes(q)) ||
          m.director.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeTab, searchQuery, myListIds]);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans selection:bg-[#E50914] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={toggleSimulatedOffline}
        onOpenStorageModal={() => setIsStorageModalOpen(true)}
        downloadsCount={storageUsage.downloadsCount}
      />

      {/* Main Content Views */}
      <main className="flex-1">
        {/* Offline Simulation Banner (Noticeable helper when in offline mode) */}
        {!isOnline && activeTab !== 'downloads' && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 mt-16">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Mode Offline Sedang Aktif:</strong> Hanya film yang sudah tersimpan di perangkat yang dapat diputar tanpa internet.
            </span>
            <button
              onClick={() => setActiveTab('downloads')}
              className="ml-2 underline font-bold hover:text-white cursor-pointer"
            >
              Buka Unduhan Saya ({storageUsage.downloadsCount})
            </button>
          </div>
        )}

        {/* View: Downloads Tab */}
        {activeTab === 'downloads' ? (
          <DownloadsView
            downloads={downloads}
            storageUsage={storageUsage}
            onPlayDownload={handlePlayDownload}
            onDeleteDownload={(id) => {
              downloadManager.removeDownload(id);
              refreshStorage();
            }}
            onPauseDownload={(id) => downloadManager.pauseDownload(id)}
            onResumeDownload={(item) => {
              const movie = MOVIES_DATA.find((m) => m.id === item.contentId);
              if (movie) {
                const ep = movie.episodes?.find((e) => e.id === item.episodeId);
                downloadManager.startDownload(movie, ep, item.quality);
              }
            }}
            onOpenStorageSettings={() => setIsStorageModalOpen(true)}
            onImportCustomVideo={handleImportCustomVideo}
            onExploreCatalog={() => setActiveTab('home')}
          />
        ) : searchQuery ? (
          /* Search Results Grid */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                Hasil Pencarian: "{searchQuery}"
              </h2>
              <span className="text-xs text-neutral-400">
                {filteredMovies.length} Judul Ditemukan
              </span>
            </div>

            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMovies.map((movie) => {
                  const dl = downloadsMap.get(movie.id);
                  const isDl = dl?.status === 'completed';
                  return (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className="group cursor-pointer rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                    >
                      <div className="aspect-[2/3] relative bg-neutral-950">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                        {isDl && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-emerald-400 font-semibold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Offline</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 space-y-1">
                        <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                        <p className="text-[10px] text-neutral-400">{movie.year} · {movie.duration}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-400 space-y-2">
                <p className="text-sm">Tidak ada film yang cocok dengan "{searchQuery}".</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#E50914] font-bold hover:underline"
                >
                  Hapus Pencarian
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Standard Catalog View */
          <div className="space-y-6 pb-20">
            {/* Hero Featured Banner (Only on Home tab) */}
            {activeTab === 'home' && (
              <HeroBanner
                movie={featuredMovie}
                onPlay={handlePlayMovie}
                onOpenDetails={setSelectedMovie}
                onStartDownload={handleStartMovieDownload}
                downloadStatus={downloadsMap.get(featuredMovie.id)}
                isOnline={isOnline}
              />
            )}

            {/* Offline Shortcut Strip: Highlights downloaded items */}
            {storageUsage.downloadsCount > 0 && activeTab === 'home' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#E50914]/20 text-[#E50914]">
                      <HardDriveDownload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {storageUsage.downloadsCount} Film Tersimpan di Perangkat Ini
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Siap diputar instan tanpa kuota atau sinyal.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('downloads')}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition border border-neutral-700 cursor-pointer"
                  >
                    Buka Unduhan Saya
                  </button>
                </div>
              </div>
            )}

            {/* Continue Watching Section if any watch progress exists */}
            {watchProgressList.length > 0 && activeTab === 'home' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 pt-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                    Lanjutkan Menonton
                  </h3>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
                  {watchProgressList.slice(0, 5).map((prog) => {
                    const dl = downloadsMap.get(prog.id);
                    const isDl = dl && dl.status === 'completed';
                    const targetMovie = MOVIES_DATA.find((m) => m.id === prog.contentId);

                    return (
                      <div
                        key={prog.id}
                        onClick={() => {
                          if (dl && isDl) {
                            handlePlayDownload(dl);
                          } else if (targetMovie) {
                            handlePlayMovie(targetMovie);
                          }
                        }}
                        className="group flex-none w-[200px] sm:w-[240px] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition cursor-pointer"
                      >
                        <div className="aspect-[16/9] relative bg-neutral-950">
                          <img
                            src={prog.posterUrl || targetMovie?.backdropUrl}
                            alt={prog.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center">
                              <Play className="w-4 h-4 fill-black ml-0.5" />
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-800">
                            <div
                              className="h-full bg-[#E50914]"
                              style={{ width: `${prog.progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-bold text-white truncate">{prog.title}</h4>
                          <span className="text-[10px] text-neutral-400">
                            {prog.progressPercent}% ditonton
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Movie Rows by Category */}
            {activeTab !== 'my-list' ? (
              CATEGORIES.map((cat) => {
                let catMovies = MOVIES_DATA;
                if (cat.id === 'action') {
                  catMovies = MOVIES_DATA.filter((m) => m.genre.includes('Aksi') || m.genre.includes('Fiksi Ilmiah'));
                } else if (cat.id === 'series') {
                  catMovies = MOVIES_DATA.filter((m) => m.type === 'series');
                } else if (cat.id === 'documentary') {
                  catMovies = MOVIES_DATA.filter((m) => m.genre.includes('Dokumenter'));
                } else if (cat.id === 'offline-ready') {
                  catMovies = MOVIES_DATA.filter((m) => m.availableOffline);
                }

                return (
                  <MovieRow
                    key={cat.id}
                    title={cat.title}
                    movies={catMovies}
                    onPlay={handlePlayMovie}
                    onOpenDetails={setSelectedMovie}
                    onStartDownload={handleStartMovieDownload}
                    downloadsMap={downloadsMap}
                    isOnline={isOnline}
                    myListIds={myListIds}
                    onToggleMyList={handleToggleMyList}
                  />
                );
              })
            ) : (
              /* My List Empty / Full */
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-6">
                <h2 className="text-xl font-bold text-white">Daftar Tontonan Saya</h2>
                {filteredMovies.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredMovies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => setSelectedMovie(movie)}
                        className="group cursor-pointer rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition"
                      >
                        <div className="aspect-[2/3] relative bg-neutral-950">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 space-y-1">
                          <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                          <p className="text-[10px] text-neutral-400">{movie.year} · {movie.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-neutral-400 space-y-3">
                    <p className="text-sm">Belum ada film di Daftar Saya.</p>
                    <button
                      onClick={() => setActiveTab('home')}
                      className="px-4 py-2 rounded-lg bg-[#E50914] text-white text-xs font-bold"
                    >
                      Jelajahi Beranda
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-10 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-brand text-lg text-[#E50914] tracking-wider">NETFLIX</span>
              <span className="text-neutral-400">Offline Vault Engine</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-neutral-400">
              <button
                onClick={() => setIsStorageModalOpen(true)}
                className="hover:text-white transition"
              >
                Penyimpanan Disk ({storageUsage.downloadsCount} Unduhan)
              </button>
              <span>·</span>
              <button
                onClick={toggleSimulatedOffline}
                className="hover:text-white transition"
              >
                {isOnline ? 'Aktifkan Simulasi Offline' : 'Kembali Mode Online'}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-neutral-400">
            Aplikasi ini menggunakan teknologi IndexedDB & PWA Service Worker untuk menyimpan konten video langsung di perangkat Anda sehingga Anda dapat menikmati tayangan secara lancar tanpa kuota internet.
          </p>
        </div>
      </footer>

      {/* Movie Details Modal */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlayMovie={handlePlayMovie}
        onPlayEpisode={handlePlayEpisode}
        onStartMovieDownload={handleStartMovieDownload}
        onStartEpisodeDownload={handleStartEpisodeDownload}
        downloadsMap={downloadsMap}
        isOnline={isOnline}
        isSavedInMyList={selectedMovie ? myListIds.has(selectedMovie.id) : false}
        onToggleMyList={handleToggleMyList}
      />

      {/* Fullscreen Video Player */}
      {activePlayer && activePlayer.isOpen && (
        <VideoPlayer
          title={activePlayer.title}
          subtitle={activePlayer.subtitle}
          contentId={activePlayer.contentId}
          episodeId={activePlayer.episodeId}
          videoSourceUrl={activePlayer.videoSourceUrl}
          posterUrl={activePlayer.posterUrl}
          isOfflinePlayback={activePlayer.isOfflinePlayback}
          onClose={() => {
            setActivePlayer(null);
            refreshWatchProgress();
          }}
          onNextEpisode={activePlayer.onNextEpisode}
          hasNextEpisode={activePlayer.hasNextEpisode}
        />
      )}

      {/* Storage Management Modal */}
      <StorageModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        storageUsage={storageUsage}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onClearAllDownloads={handleClearAllDownloads}
      />

      {/* Non-intrusive Offline Indicator Toast */}
      <OfflineIndicator
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onReconnect={toggleSimulatedOffline}
        downloadsCount={storageUsage.downloadsCount}
      />
    </div>
  );
}
