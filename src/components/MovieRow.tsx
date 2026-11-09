import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, DownloadItem } from '../types';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  onStartDownload: (movie: Movie) => void;
  downloadsMap: Map<string, DownloadItem>;
  isOnline: boolean;
  myListIds: Set<string>;
  onToggleMyList: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  onPlay,
  onOpenDetails,
  onStartDownload,
  downloadsMap,
  isOnline,
  myListIds,
  onToggleMyList,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies.length) return null;

  return (
    <div className="space-y-3 py-4 group/row relative">
      {/* Category Section Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
          {title}
        </h3>
        <span className="text-xs text-neutral-400 font-medium">
          {movies.length} Judul
        </span>
      </div>

      {/* Carousel Container with Scroll Arrows */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
          aria-label="Gulir ke kiri"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={rowRef}
          className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 py-2 scroll-smooth"
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onStartDownload={onStartDownload}
              downloadStatus={downloadsMap.get(movie.id)}
              isOnline={isOnline}
              isSavedInMyList={myListIds.has(movie.id)}
              onToggleMyList={onToggleMyList}
            />
          ))}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
          aria-label="Gulir ke kanan"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
