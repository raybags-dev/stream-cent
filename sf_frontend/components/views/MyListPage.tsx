import React, { useState, useEffect } from 'react';
import { Title } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import { PosterCard } from '../media/PosterCard';
import { TitleDetailModal } from '../media/TitleDetailModal';
import { EmptyState } from '../ui/EmptyState';
import { CardSkeleton } from '../ui/Skeleton';
import { Bookmark, SlidersHorizontal } from 'lucide-react';

export const MyListPage: React.FC = () => {
  const { user, navigate } = useAuth();
  const [titles, setTitles] = useState<Title[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'movie' | 'series'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'match'>('recent');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    streamFlixApi.getTitles().then((all) => {
      if (isMounted) {
        const savedIds = user?.myList || [];
        // Preserve user's order in myList (reverse so newest is first)
        let savedTitles = savedIds
          .map((id) => all.find((t) => t.id === id))
          .filter((t): t is Title => !!t);

        if (selectedType !== 'all') {
          savedTitles = savedTitles.filter((t) => t.type === selectedType);
        }

        if (sortBy === 'title') {
          savedTitles.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === 'match') {
          savedTitles.sort((a, b) => b.matchScore - a.matchScore);
        }

        setTitles(savedTitles);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.myList, selectedType, sortBy]);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-20 sm:pt-24 pb-16 sm:pb-20 px-3.5 sm:px-8 md:px-12">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>My List</span>
              <span className="text-xs sm:text-sm font-mono px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-normal">
                {user?.myList.length || 0}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Titles you've saved to watch next across all your devices.
            </p>
          </div>

          {/* Filters & Sorting */}
          {user && user.myList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Type Filter */}
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
                    {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Series'}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 bg-[#14141a] border border-white/20 rounded-md px-3 py-1.5 text-xs text-white">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                  aria-label="Sort My List"
                >
                  <option value="recent" className="bg-[#14141a]">Recently Added</option>
                  <option value="match" className="bg-[#14141a]">Match Score</option>
                  <option value="title" className="bg-[#14141a]">Alphabetical</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            icon={<Bookmark className="w-7 h-7 text-[#e50914]" />}
            title="Your List is empty"
            description="Explore our library and tap the '+' button on any movie or series to bookmark it for later."
            actionLabel="Browse Popular Titles"
            onAction={() => navigate('/browse')}
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
