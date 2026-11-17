import React, { useState, useEffect } from 'react';
import { Title } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { GENRE_CATEGORIES } from '../../lib/api/mockData';
import { useAuth } from '../../lib/auth/authContext';
import { PosterCard } from '../media/PosterCard';
import { TitleDetailModal } from '../media/TitleDetailModal';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Filter, SlidersHorizontal } from 'lucide-react';

export const GenrePage: React.FC = () => {
  const { currentPath, activeProfile } = useAuth();

  // Extract genre param from hash or query if present (e.g. #/browse/genre?id=sci-fi)
  const initialGenreId = (() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]id=([^&]+)/);
      return match ? match[1] : 'all';
    }
    return 'all';
  })();

  const [selectedGenreId, setSelectedGenreId] = useState(initialGenreId || 'all');
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'year' | 'match' | 'title'>('popularity');
  const [titles, setTitles] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const activeCat = GENRE_CATEGORIES.find((c) => c.id === selectedGenreId);
    const genreParam = activeCat && activeCat.genre ? activeCat.genre : undefined;

    streamFlixApi
      .getTitles({
        genre: genreParam,
        type: selectedType === 'all' ? undefined : selectedType,
        year: selectedYear === 'all' ? undefined : parseInt(selectedYear, 10),
        profileKidsLimit: activeProfile?.isKids,
        sortBy,
      })
      .then((res) => {
        if (isMounted) {
          setTitles(res);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedGenreId, selectedType, selectedYear, sortBy, activeProfile]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-20 sm:pt-24 pb-16 sm:pb-20 px-3.5 sm:px-8 md:px-12">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Browse by Genre
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Explore award-winning originals, box-office movies, and addictive series.
            </p>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type selector */}
            <div className="flex items-center bg-[#14141a] border border-white/20 rounded-md p-0.5 text-xs">
              {(['all', 'movie', 'series'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded font-medium capitalize transition-colors ${
                    selectedType === t
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV Shows'}
                </button>
              ))}
            </div>

            {/* Release Year selector */}
            <div className="flex items-center gap-1.5 bg-[#14141a] border border-white/20 rounded-md px-3 py-1.5 text-xs text-white">
              <span className="text-neutral-400 text-[11px] font-medium">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer text-xs"
                aria-label="Filter by release year"
              >
                <option value="all" className="bg-[#14141a]">All Years</option>
                <option value="2026" className="bg-[#14141a]">2026</option>
                <option value="2025" className="bg-[#14141a]">2025</option>
                <option value="2024" className="bg-[#14141a]">2024</option>
                <option value="2023" className="bg-[#14141a]">2023</option>
                <option value="2022" className="bg-[#14141a]">2022</option>
                <option value="2021" className="bg-[#14141a]">2021</option>
                <option value="2020" className="bg-[#14141a]">2020</option>
                <option value="2015" className="bg-[#14141a]">2015</option>
                <option value="2010" className="bg-[#14141a]">2010 & Older</option>
              </select>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 bg-[#14141a] border border-white/20 rounded-md px-3 py-1.5 text-xs text-white">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
                aria-label="Sort Titles"
              >
                <option value="popularity" className="bg-[#14141a]">Suggested for You</option>
                <option value="year" className="bg-[#14141a]">Release Year</option>
                <option value="match" className="bg-[#14141a]">Highest Match Score</option>
                <option value="title" className="bg-[#14141a]">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Genre Filter Buttons (Segmented Filter Controls per Rule §1.A) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {GENRE_CATEGORIES.map((cat) => {
            const isSelected = selectedGenreId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedGenreId(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-[#14141a] text-neutral-300 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : titles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 pt-2">
            {titles.map((item) => (
              <PosterCard
                key={item.id}
                title={item}
                onOpenDetails={(t) => setSelectedTitle(t)}
                aspect="poster"
                fillContainer={true}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No titles found"
            description="We couldn't find any titles matching this genre and filter combination. Try selecting another genre or clearing filters."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedGenreId('all');
              setSelectedType('all');
            }}
          />
        )}
      </div>

      {/* Title Detail Modal */}
      <TitleDetailModal
        title={selectedTitle}
        onClose={() => setSelectedTitle(null)}
        onSelectTitle={(t) => setSelectedTitle(t)}
      />
    </div>
  );
};
