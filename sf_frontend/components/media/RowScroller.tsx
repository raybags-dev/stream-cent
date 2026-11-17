import React, { useRef, useState } from 'react';
import { Title, WatchProgress } from '../../types';
import { PosterCard } from './PosterCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RowScrollerProps {
  title: string;
  titles: Title[];
  watchHistory?: WatchProgress[];
  onOpenDetails: (title: Title) => void;
  isRanked?: boolean;
  aspect?: 'poster' | 'backdrop';
  explorePath?: string;
  onExplore?: () => void;
}

export const RowScroller: React.FC<RowScrollerProps> = ({
  title,
  titles,
  watchHistory,
  onOpenDetails,
  isRanked = false,
  aspect = 'poster',
  explorePath,
  onExplore,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (titles.length === 0) return null;

  return (
    <div className="relative group/row my-8 sm:my-10 px-4 sm:px-8 md:px-12">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        {onExplore && (
          <button
            onClick={onExplore}
            className="text-xs sm:text-sm font-semibold text-[#b3b3b3] hover:text-white transition-colors flex items-center gap-1 group-hover/row:opacity-100 opacity-80 cursor-pointer"
          >
            <span>Explore All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scroller Area */}
      <div className="relative">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-xs rounded-r-md cursor-pointer"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
        >
          {titles.map((item, index) => {
            const progress = watchHistory?.find((w) => w.titleId === item.id);
            return (
              <PosterCard
                key={item.id}
                title={item}
                progress={progress}
                onOpenDetails={onOpenDetails}
                rank={isRanked ? index + 1 : undefined}
                aspect={aspect}
              />
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all opacity-0 group-hover/row:opacity-100 backdrop-blur-xs rounded-l-md cursor-pointer"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        )}
      </div>
    </div>
  );
};
