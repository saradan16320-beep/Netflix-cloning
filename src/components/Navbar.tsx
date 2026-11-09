import React, { useState, useEffect } from 'react';
import { Search, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  onOpenStorageModal: () => void;
  downloadsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onOpenStorageModal,
  downloadsCount,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Beranda' },
    { id: 'series', label: 'Serial TV' },
    { id: 'movies', label: 'Film' },
    { id: 'my-list', label: 'Daftar Saya' },
    { id: 'downloads', label: `Unduhan Saya${downloadsCount > 0 ? ` (${downloadsCount})` : ''}` },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#141414]/95 backdrop-blur-md shadow-lg border-b border-white/5'
          : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('home')}
            className="flex items-baseline gap-1.5 focus:outline-none group text-left cursor-pointer"
          >
            <span className="text-2xl sm:text-3xl font-brand font-black text-[#E50914] tracking-wider leading-none">
              NETFLIX
            </span>
            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase bg-neutral-800/80 px-1.5 py-0.5 rounded border border-neutral-700">
              OFFLINE
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            const isDownloads = link.id === 'downloads';
            return (
              <button
                key={link.id}
                onClick={() => onTabChange(link.id)}
                className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer relative py-1 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {link.label}
                {isDownloads && downloadsCount > 0 && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-[#E50914] align-middle" />
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E50914] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Tools */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Bar */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center bg-black/80 border border-neutral-700 rounded-md px-2.5 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-neutral-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Judul, genre, pemeran..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery) setIsSearchOpen(false);
                  }}
                  className="bg-transparent text-white placeholder-neutral-500 focus:outline-none w-36 sm:w-48 text-xs"
                />
              </div>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Cari film"
                aria-label="Cari film"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Offline Mode Simulator Toggle Button */}
          <button
            onClick={onToggleSimulatedOffline}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
              !isOnline
                ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700/80 border border-neutral-700'
            }`}
            title={
              !isOnline
                ? 'Sedang dalam Mode Offline. Klik untuk kembali online.'
                : 'Klik untuk beralih ke Simulasi Mode Offline (hanya memutar film terunduh).'
            }
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Offline Aktif</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Simulasi Offline</span>
              </>
            )}
          </button>

          {/* Storage Manager Button */}
          <button
            onClick={onOpenStorageModal}
            className="flex items-center gap-1 p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Kelola Ruang Penyimpanan Offline"
            aria-label="Kelola Ruang Penyimpanan Offline"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded bg-[#E50914] flex items-center justify-center font-bold text-xs text-white shadow-inner select-none cursor-pointer">
            NF
          </div>
        </div>
      </div>

      {/* Mobile Sub Navigation bar */}
      <div className="md:hidden flex items-center justify-around py-2 px-2 bg-neutral-900/95 border-t border-neutral-800 text-xs">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onTabChange(link.id)}
            className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
              activeTab === link.id
                ? 'text-white font-bold bg-neutral-800'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
};
