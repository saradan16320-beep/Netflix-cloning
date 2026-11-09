import React from 'react';
import { WifiOff, RotateCcw } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onReconnect: () => void;
  downloadsCount: number;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  isSimulatedOffline,
  onReconnect,
  downloadsCount,
}) => {
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-sm flex items-center gap-3 rounded-xl bg-amber-500/95 text-black px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-300 animate-slide-up">
      <div className="p-1 rounded-full bg-black/10 shrink-0">
        <WifiOff className="w-4 h-4 text-black" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold leading-tight truncate">
          {isSimulatedOffline ? 'Simulasi Mode Offline Aktif' : 'Koneksi Internet Terputus'}
        </p>
        <p className="text-[11px] text-black/80 font-normal leading-tight">
          Hanya memutar {downloadsCount} film yang tersimpan di perangkat.
        </p>
      </div>

      <button
        onClick={onReconnect}
        className="px-2.5 py-1 rounded bg-black text-white text-[11px] font-bold hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1 shrink-0"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Online</span>
      </button>
    </div>
  );
};
