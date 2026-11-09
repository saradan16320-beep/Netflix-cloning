import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded bg-[#E50914] px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-[#b81d24] transition-all whitespace-nowrap shrink-0"
        title="Instal aplikasi ke perangkat Anda untuk akses offline instan"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-all whitespace-nowrap shrink-0"
        >
          <Download className="w-3 h-3 text-[#E50914]" />
          <span>Instal di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white">
              <h3 className="text-base font-bold text-white mb-2">Instal Netflix di iPhone / iPad</h3>
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                1. Ketuk tombol <strong>Bagikan (Share)</strong> pada toolbar Safari di bagian bawah.<br />
                2. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded bg-[#E50914] py-2 text-xs font-semibold text-white hover:bg-[#b81d24] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
