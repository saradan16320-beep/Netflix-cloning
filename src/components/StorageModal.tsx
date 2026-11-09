import React, { useState } from 'react';
import { X, HardDrive, Trash2, Smartphone, ShieldCheck, Check } from 'lucide-react';
import { UserSettings } from '../types';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  storageUsage: { usedBytes: number; quotaBytes: number; downloadsCount: number };
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onClearAllDownloads: () => Promise<void>;
}

export const StorageModal: React.FC<StorageModalProps> = ({
  isOpen,
  onClose,
  storageUsage,
  settings,
  onSaveSettings,
  onClearAllDownloads,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const handleToggle = (key: keyof UserSettings) => {
    const updated = {
      ...localSettings,
      [key]: !localSettings[key],
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleQualityChange = (quality: 'standard' | 'high') => {
    const updated = {
      ...localSettings,
      downloadQuality: quality,
    };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClearAllDownloads();
      setConfirmClear(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#181818] rounded-2xl border border-neutral-800 shadow-2xl p-6 text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-neutral-800 text-[#E50914]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Pengaturan Unduhan & Penyimpanan
              </h2>
              <p className="text-xs text-neutral-400">
                Kelola ruang disk lokal dan preferensi unduh offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Space Summary */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Penyimpanan Terpakai Netflix</span>
            <span className="font-bold text-[#E50914]">{formatBytes(storageUsage.usedBytes)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Jumlah Konten Terunduh</span>
            <span className="font-bold text-white">{storageUsage.downloadsCount} Berkas</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Kapasitas Maksimal Browser (Quota)</span>
            <span className="font-mono text-neutral-300">~{formatBytes(storageUsage.quotaBytes)}</span>
          </div>
        </div>

        {/* Quality Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
            Kualitas Video Unduhan
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQualityChange('standard')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                localSettings.downloadQuality === 'standard'
                  ? 'border-[#E50914] bg-[#E50914]/10 text-white'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">Standar (Hemat Ruang)</span>
                {localSettings.downloadQuality === 'standard' && (
                  <Check className="w-4 h-4 text-[#E50914]" />
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Unduhan lebih cepat, menggunakan memori penyimpanan lebih hemat.
              </p>
            </button>

            <button
              onClick={() => handleQualityChange('high')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                localSettings.downloadQuality === 'high'
                  ? 'border-[#E50914] bg-[#E50914]/10 text-white'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs">Tinggi (1080p Ultra HD)</span>
                {localSettings.downloadQuality === 'high' && (
                  <Check className="w-4 h-4 text-[#E50914]" />
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Kualitas visual terbaik untuk layar besar dan kejernihan audio.
              </p>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-neutral-800 pt-4">
          {/* Smart Downloads */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Unduhan Pintar (Smart Downloads)</span>
              <p className="text-[11px] text-neutral-400">
                Hapus otomatis episode yang sudah selesai ditonton dan siapkan episode berikutnya.
              </p>
            </div>
            <button
              onClick={() => handleToggle('smartDownloads')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                localSettings.smartDownloads ? 'bg-[#E50914]' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  localSettings.smartDownloads ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Wi-Fi Only */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Hanya Mengunduh Lewat Wi-Fi</span>
              <p className="text-[11px] text-neutral-400">
                Mencegah penggunaan kuota data seluler saat mengunduh berkas film besar.
              </p>
            </div>
            <button
              onClick={() => handleToggle('wifiOnly')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                localSettings.wifiOnly ? 'bg-[#E50914]' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  localSettings.wifiOnly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Clear All Downloads with confirmation */}
        <div className="border-t border-neutral-800 pt-4">
          {confirmClear ? (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2">
              <p className="text-xs text-red-200">
                Apakah Anda yakin ingin menghapus <strong>semua ({storageUsage.downloadsCount})</strong> film dari penyimpanan offline? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  disabled={isClearing}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isClearing ? 'Menghapus...' : 'Ya, Hapus Semua'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              disabled={storageUsage.downloadsCount === 0}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-700 text-xs font-semibold transition cursor-pointer ${
                storageUsage.downloadsCount === 0
                  ? 'opacity-40 cursor-not-allowed text-neutral-500'
                  : 'text-red-400 hover:bg-red-950/30 hover:border-red-500/50'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Unduhan ({storageUsage.downloadsCount})</span>
            </button>
          )}
        </div>

        {/* Security / Offline Notice */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Penyimpanan terisolasi aman di database IndexedDB perangkat Anda, sepenuhnya dapat diputar tanpa jaringan luar.
          </span>
        </div>
      </div>
    </div>
  );
};
