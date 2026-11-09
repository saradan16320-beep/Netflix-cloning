import React, { useState, useRef } from 'react';
import {
  Download,
  Play,
  Trash2,
  HardDrive,
  Upload,
  Pause,
  AlertCircle,
  FileVideo,
  CheckCircle2,
  Settings,
  Film,
  Tv,
} from 'lucide-react';
import { DownloadItem } from '../types';

interface DownloadsViewProps {
  downloads: DownloadItem[];
  storageUsage: { usedBytes: number; quotaBytes: number; downloadsCount: number };
  onPlayDownload: (item: DownloadItem) => void;
  onDeleteDownload: (id: string) => void;
  onPauseDownload: (id: string) => void;
  onResumeDownload: (item: DownloadItem) => void;
  onOpenStorageSettings: () => void;
  onImportCustomVideo: (file: File, title: string) => Promise<void>;
  onExploreCatalog: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  storageUsage,
  onPlayDownload,
  onDeleteDownload,
  onPauseDownload,
  onResumeDownload,
  onOpenStorageSettings,
  onImportCustomVideo,
  onExploreCatalog,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series' | 'custom'>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Separate active downloading vs completed
  const activeDownloads = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'pending' || d.status === 'paused'
  );
  const completedDownloads = downloads.filter((d) => d.status === 'completed');

  // Filter completed downloads
  const filteredCompleted = completedDownloads.filter((item) => {
    if (filterType === 'all') return true;
    if (filterType === 'movie') return item.type === 'movie' && !item.isCustomUpload;
    if (filterType === 'series') return item.type === 'series';
    if (filterType === 'custom') return item.isCustomUpload;
    return true;
  });

  // Calculate sizes
  const totalDownloadBytes = completedDownloads.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      try {
        await onImportCustomVideo(file, customTitle || file.name.replace(/\.[^/.]+$/, ''));
        setCustomTitle('');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Storage percentage calculation
  const quota = storageUsage.quotaBytes || 10 * 1024 * 1024 * 1024;
  const netflixPercent = Math.min(100, Math.max(1, (totalDownloadBytes / quota) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 space-y-8 animate-fade-in">
      {/* Top Header & Storage Widget */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E50914] tracking-wider uppercase mb-1">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Penyimpanan Offline Perangkat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Unduhan Saya
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Tonton semua film dan video di bawah ini kapan saja, di mana saja tanpa membutuhkan koneksi internet.
          </p>
        </div>

        {/* Quick Tools: Storage Settings & Custom Video Upload */}
        <div className="flex items-center gap-3">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/mp4,video/webm,video/ogg,video/x-matroska"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            title="Pilih file video dari komputer atau ponsel Anda untuk disimpan ke perpustakaan offline"
          >
            <Upload className="w-4 h-4 text-[#E50914]" />
            <span>{isImporting ? 'Menyimpan...' : 'Impor Video Sendiri'}</span>
          </button>

          <button
            onClick={onOpenStorageSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Unduhan</span>
          </button>
        </div>
      </div>

      {/* Storage Breakdown Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Penggunaan Ruang:</span>
            <span className="text-[#E50914] font-bold">{formatBytes(totalDownloadBytes)}</span>
            <span className="text-neutral-500">terpakai oleh {completedDownloads.length} unduhan Netflix</span>
          </div>
          <span className="text-neutral-400">
            Kapasitas Tersedia: ~{formatBytes(quota - totalDownloadBytes)}
          </span>
        </div>

        {/* Storage Bar */}
        <div className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-[#E50914] transition-all duration-500 rounded-l-full"
            style={{ width: `${netflixPercent}%` }}
            title={`Netflix Unduhan: ${formatBytes(totalDownloadBytes)}`}
          />
          <div
            className="h-full bg-neutral-700/80"
            style={{ width: `15%` }}
            title="Aplikasi & Sistem Lain"
          />
        </div>

        <div className="flex items-center gap-6 text-[11px] text-neutral-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E50914]" />
            <span>Unduhan Netflix Offline ({formatBytes(totalDownloadBytes)})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
            <span>Data Sistem Lain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
            <span>Ruang Kosong</span>
          </div>
        </div>
      </div>

      {/* Active Downloading Queue (If any) */}
      {activeDownloads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span>Sedang Berjalan ({activeDownloads.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDownloads.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-14 h-10 object-cover rounded bg-neutral-950 shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-10 rounded bg-neutral-800 flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5 text-neutral-400" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    {item.subtitle && (
                      <p className="text-[10px] text-neutral-400 truncate">{item.subtitle}</p>
                    )}
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-[#E50914] h-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                      <span>{item.downloadSpeed || 'Menghubungkan...'}</span>
                      <span>{item.progress}% ({formatBytes(item.downloadedBytes)} / {formatBytes(item.fileSizeBytes)})</span>
                    </div>
                  </div>
                </div>

                {/* Pause/Resume and Cancel Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'downloading' ? (
                    <button
                      onClick={() => onPauseDownload(item.id)}
                      className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                      title="Jeda Unduhan"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onResumeDownload(item)}
                      className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                      title="Lanjutkan Unduhan"
                    >
                      <Play className="w-4 h-4 fill-emerald-400" />
                    </button>
                  )}

                  <button
                    onClick={() => onDeleteDownload(item.id)}
                    className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition cursor-pointer"
                    title="Batalkan Unduhan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs (Interactive Filter Controls: Buttons/tabs with click handlers) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Semua ({completedDownloads.length})
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filterType === 'movie'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Film</span>
          </button>
          <button
            onClick={() => setFilterType('series')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filterType === 'series'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>Episode Serial</span>
          </button>
          <button
            onClick={() => setFilterType('custom')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              filterType === 'custom'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileVideo className="w-3 h-3" />
            <span>Video Impor</span>
          </button>
        </div>

        {filteredCompleted.length > 0 && (
          <span className="text-xs text-neutral-400">
            Menampilkan {filteredCompleted.length} film siap tonton
          </span>
        )}
      </div>

      {/* Completed Downloads Grid */}
      {filteredCompleted.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompleted.map((item) => (
            <div
              key={item.id}
              className="group relative bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 hover:border-neutral-700 transition-all shadow-lg flex flex-col justify-between"
            >
              {/* Top Media Thumbnail */}
              <div
                onClick={() => onPlayDownload(item)}
                className="relative aspect-video w-full bg-neutral-950 overflow-hidden cursor-pointer"
              >
                {item.posterUrl ? (
                  <img
                    src={item.backdropUrl || item.posterUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <FileVideo className="w-12 h-12 text-neutral-500" />
                  </div>
                )}

                {/* Scrim & Big Center Play Button */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 group-hover:bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                </div>

                {/* Top Corner Offline Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Siap Ditonton Offline</span>
                </div>

                {/* Quality & Size */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-neutral-300 border border-white/10">
                  {formatBytes(item.fileSizeBytes)}
                </div>
              </div>

              {/* Card Details & Actions */}
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-neutral-200">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs">
                  <span className="text-neutral-400 text-[11px]">
                    Diunduh: {item.completedAt ? new Date(item.completedAt).toLocaleDateString('id-ID') : 'Hari ini'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPlayDownload(item)}
                      className="px-3 py-1 rounded bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Putar</span>
                    </button>
                    <button
                      onClick={() => onDeleteDownload(item.id)}
                      className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition cursor-pointer"
                      title="Hapus dari penyimpanan offline"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-4 text-center rounded-2xl bg-neutral-900/50 border border-neutral-800 max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <Download className="w-8 h-8 text-[#E50914]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Belum Ada Film yang Diunduh
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
              Simpan film dan episode favorit Anda ke perangkat agar bisa ditonton saat bepergian, di pesawat, atau saat koneksi internet terputus.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={onExploreCatalog}
              className="px-4 py-2 rounded-lg bg-[#E50914] hover:bg-[#b81d24] text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              Jelajahi Film untuk Diunduh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            >
              Impor File Video Pribadi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
