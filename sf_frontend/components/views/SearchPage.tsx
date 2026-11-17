import React, { useState, useEffect, useRef } from 'react';
import { Title } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import { PosterCard } from '../media/PosterCard';
import { TitleDetailModal } from '../media/TitleDetailModal';
import { CardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { Search, X, History, Sparkles, SlidersHorizontal } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { activeProfile } = useAuth();

  // Read initial query from URL hash/search if present (e.g. #/search?q=alien)
  const initialQuery = (() => {
    if (typeof window !== 'undefined') {
      const match = window.location.hash.match(/[?&]q=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : '';
    }
    return '';
  })();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [only4k, setOnly4k] = useState(false);
  const [results, setResults] = useState<Title[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Alien',
    'Horror',
    'Romantic Comedy',
    'Sci-Fi',
    'Heist',
    'Cyberpunk',
  ]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debouncedQuery or filters change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    streamFlixApi
      .getTitles({
        search: debouncedQuery,
        type: selectedType === 'all' ? undefined : selectedType,
        genre: selectedGenre === 'all' ? undefined : selectedGenre,
        year: selectedYear === 'all' ? undefined : parseInt(selectedYear, 10),
        profileKidsLimit: activeProfile?.isKids,
      })
      .then((res) => {
        if (isMounted) {
          let filtered = res;
          if (only4k) {
            filtered = filtered.filter((t) => t.qualities.includes('4K Ultra HD'));
          }
          setResults(filtered);
          setIsLoading(false);

          // Save to recent searches if non-empty
          if (debouncedQuery.trim().length > 2) {
            setRecentSearches((prev) => {
              const cleaned = [
                debouncedQuery.trim(),
                ...prev.filter((s) => s.toLowerCase() !== debouncedQuery.trim().toLowerCase()),
              ];
              return cleaned.slice(0, 6);
            });
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedType, selectedYear, selectedGenre, only4k, activeProfile]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-20 sm:pt-24 pb-16 sm:pb-20 px-3.5 sm:px-8 md:px-12">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Search Input Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-[#14141a] border border-white/20 rounded-full px-5 py-3.5 shadow-2xl focus-within:border-white focus-within:ring-2 focus-within:ring-white">
            <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, director, cast, or genre..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-neutral-400 hover:text-white rounded-full"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Recent Searches Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-1 text-xs">
            <span className="text-neutral-500 flex items-center gap-1 font-medium">
              <History className="w-3.5 h-3.5" /> Recent:
            </span>
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            {(['all', 'movie', 'series'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedType === t
                    ? 'bg-white text-black border-white'
                    : 'bg-[#14141a] text-neutral-400 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t === 'movie' ? 'Movies Only' : 'TV Series Only'}
              </button>
            ))}

            <button
              onClick={() => setOnly4k(!only4k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                only4k
                  ? 'bg-[#e50914] text-white border-[#e50914]'
                  : 'bg-[#14141a] text-neutral-400 border-white/15 hover:border-white/40 hover:text-white'
              }`}
            >
              4K Ultra HD
            </button>

            {/* Release Year Filter */}
            <div className="flex items-center gap-1.5 bg-[#14141a] border border-white/15 rounded-full px-3 py-1 text-xs text-neutral-300">
              <span className="text-neutral-400 text-[11px] font-medium">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
                aria-label="Filter by release year"
              >
                <option value="all" className="bg-[#14141a] text-white">All Years</option>
                <option value="2026" className="bg-[#14141a] text-white">2026</option>
                <option value="2025" className="bg-[#14141a] text-white">2025</option>
                <option value="2024" className="bg-[#14141a] text-white">2024</option>
                <option value="2023" className="bg-[#14141a] text-white">2023</option>
                <option value="2022" className="bg-[#14141a] text-white">2022</option>
                <option value="2021" className="bg-[#14141a] text-white">2021</option>
                <option value="2020" className="bg-[#14141a] text-white">2020</option>
                <option value="2019" className="bg-[#14141a] text-white">2019</option>
                <option value="2018" className="bg-[#14141a] text-white">2018</option>
                <option value="2015" className="bg-[#14141a] text-white">2015</option>
                <option value="2010" className="bg-[#14141a] text-white">2010</option>
              </select>
            </div>

            {/* Genre Filter */}
            <div className="flex items-center gap-1.5 bg-[#14141a] border border-white/15 rounded-full px-3 py-1 text-xs text-neutral-300">
              <span className="text-neutral-400 text-[11px] font-medium">Genre:</span>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
                aria-label="Filter by genre"
              >
                <option value="all" className="bg-[#14141a] text-white">All Genres</option>
                <option value="Horror" className="bg-[#14141a] text-white">Horror</option>
                <option value="Romantic Comedy" className="bg-[#14141a] text-white">Romantic Comedy</option>
                <option value="Sci-Fi" className="bg-[#14141a] text-white">Sci-Fi</option>
                <option value="Action" className="bg-[#14141a] text-white">Action</option>
                <option value="Crime" className="bg-[#14141a] text-white">Crime</option>
                <option value="Fantasy" className="bg-[#14141a] text-white">Fantasy</option>
                <option value="Drama" className="bg-[#14141a] text-white">Drama</option>
                <option value="Comedy" className="bg-[#14141a] text-white">Comedy</option>
                <option value="Documentary" className="bg-[#14141a] text-white">Documentary</option>
              </select>
            </div>
          </div>

          {/* Result Count Indicator */}
          <div className="text-xs text-neutral-400 font-mono">
            {isLoading ? 'Searching library...' : `Found ${results.length} titles`}
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4 pt-2">
            {results.map((item) => (
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
            title={`No results found for "${debouncedQuery}"`}
            description="Explore different keywords, search for actor or director names, or browse by genre."
            actionLabel="Clear Search"
            onAction={() => {
              setQuery('');
              setSelectedType('all');
              setOnly4k(false);
            }}
          />
        )}
      </div>

      {/* Modal Detail Overlay */}
      <TitleDetailModal
        title={selectedTitle}
        onClose={() => setSelectedTitle(null)}
        onSelectTitle={(t) => setSelectedTitle(t)}
      />
    </div>
  );
};
