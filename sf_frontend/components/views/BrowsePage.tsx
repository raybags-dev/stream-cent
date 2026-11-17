import React, { useState, useEffect } from 'react';
import { Title } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { useAuth } from '../../lib/auth/authContext';
import { BackdropHero } from '../media/BackdropHero';
import { RowScroller } from '../media/RowScroller';
import { TitleDetailModal } from '../media/TitleDetailModal';
import { BillboardSkeleton, RowSkeleton } from '../ui/Skeleton';

export const BrowsePage: React.FC<{ filterType?: 'movie' | 'series' | 'new' }> = ({
  filterType,
}) => {
  const { user, activeProfile, navigate } = useAuth();
  // Seed with bundled default titles so the page paints instantly, then hydrate
  // from the API in the background.
  const [billboardTitle, setBillboardTitle] = useState<Title | null>(() =>
    streamFlixApi.getInitialBillboard()
  );
  const [allTitles, setAllTitles] = useState<Title[]>(() =>
    streamFlixApi.getInitialTitles({
      type: filterType === 'new' ? undefined : filterType,
      profileKidsLimit: activeProfile?.isKids,
    })
  );
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const isKids = activeProfile?.isKids;
        const [titles, billboard] = await Promise.all([
          streamFlixApi.getTitles({
            type: filterType === 'new' ? undefined : filterType,
            profileKidsLimit: isKids,
          }),
          streamFlixApi.getFeaturedBillboard(),
        ]);

        if (isMounted) {
          setAllTitles(titles);
          setBillboardTitle(billboard);
        }
      } catch (err) {
        console.error('Failed to load streaming library', err);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [filterType, activeProfile]);

  if (!billboardTitle) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] pb-16">
        <BillboardSkeleton />
        <RowSkeleton />
        <RowSkeleton />
        <RowSkeleton />
      </div>
    );
  }

  // Filter rows
  const continueWatchingTitles = allTitles.filter((t) =>
    user?.watchHistory.some((w) => w.titleId === t.id)
  );

  const top10Titles = allTitles
    .filter((t) => t.isTop10)
    .sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));

  const trendingTitles = allTitles.filter((t) => t.isTrending);
  const newReleaseTitles = allTitles.filter((t) => t.isNewRelease);
  const horrorTitles = allTitles.filter((t) => t.genres.some((g) => g.toLowerCase().includes('horror')));
  const romComTitles = allTitles.filter(
    (t) =>
      t.genres.some((g) => g.toLowerCase().includes('romantic')) ||
      (t.genres.some((g) => g.toLowerCase().includes('romance')) &&
        t.genres.some((g) => g.toLowerCase().includes('comedy')))
  );
  const sciFiTitles = allTitles.filter((t) => t.genres.includes('Sci-Fi'));
  const crimeTitles = allTitles.filter((t) => t.genres.includes('Crime') || t.genres.includes('Thriller'));
  const fantasyTitles = allTitles.filter((t) => t.genres.includes('Fantasy'));
  const dramaTitles = allTitles.filter((t) => t.genres.includes('Drama'));
  const comedyTitles = allTitles.filter((t) => t.genres.includes('Comedy'));
  const docTitles = allTitles.filter((t) => t.genres.includes('Documentary'));
  const animeTitles = allTitles.filter((t) => t.genres.includes('Anime') || t.genres.includes('Kids'));

  // Curate list of trending and newly added movies for the hero billboard carousel
  const featuredHeroTitles = [
    billboardTitle,
    ...allTitles.filter((t) => (t.isTrending || t.isNewRelease || t.isTop10) && t.id !== billboardTitle.id),
  ].slice(0, 5);

  return (
    <div className="min-h-screen bg-[#0b0b0f] pb-24 overflow-x-hidden">
      {/* Billboard Hero Header (Auto-cycling Netflix-style billboard on big screen) */}
      <BackdropHero
        title={billboardTitle}
        titles={featuredHeroTitles}
        onOpenDetails={(title) => setSelectedTitle(title)}
      />

      {/* Rows Container with generous clearance below hero CTAs */}
      <div className="relative -mt-8 sm:-mt-12 md:-mt-16 z-20 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Continue Watching (Personalized) */}
        {continueWatchingTitles.length > 0 && (
          <RowScroller
            title={`Continue Watching for ${activeProfile?.name || 'You'}`}
            titles={continueWatchingTitles}
            watchHistory={user?.watchHistory}
            onOpenDetails={(t) => setSelectedTitle(t)}
            aspect="backdrop"
          />
        )}

        {/* Top 10 in Stream Flix Today */}
        <RowScroller
          title="Top 10 in Stream Flix Today"
          titles={top10Titles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          isRanked={true}
        />

        {/* Trending Now */}
        <RowScroller
          title="Trending Now"
          titles={trendingTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=action')}
        />

        {/* New Releases */}
        <RowScroller
          title="New Releases"
          titles={newReleaseTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/new')}
        />

        {/* Spine-Chilling Horror */}
        {horrorTitles.length > 0 && (
          <RowScroller
            title="Spine-Chilling Horror & Paranormal Thrillers"
            titles={horrorTitles}
            onOpenDetails={(t) => setSelectedTitle(t)}
            onExplore={() => navigate('/browse/genre?id=horror')}
          />
        )}

        {/* Romantic Comedies */}
        {romComTitles.length > 0 && (
          <RowScroller
            title="Feel-Good Romantic Comedies"
            titles={romComTitles}
            onOpenDetails={(t) => setSelectedTitle(t)}
            onExplore={() => navigate('/browse/genre?id=romantic-comedy')}
          />
        )}

        {/* Sci-Fi & Cyberpunk */}
        <RowScroller
          title="Sci-Fi & Cyberpunk"
          titles={sciFiTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=sci-fi')}
        />

        {/* Crime & Noir */}
        <RowScroller
          title="Crime & Noir Thrillers"
          titles={crimeTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=crime')}
        />

        {/* Epic Fantasy */}
        <RowScroller
          title="Epic Fantasy & Mythic Adventures"
          titles={fantasyTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=fantasy')}
        />

        {/* Award-Winning Dramas */}
        <RowScroller
          title="Award-Winning Dramas"
          titles={dramaTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=drama')}
        />

        {/* Comedies & Sitcoms */}
        <RowScroller
          title="Comedies & Feel-Good Stories"
          titles={comedyTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=comedy')}
        />

        {/* Documentaries */}
        <RowScroller
          title="Fascinating Documentaries"
          titles={docTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=documentary')}
        />

        {/* Anime / Animation */}
        <RowScroller
          title="Anime & Animated Universes"
          titles={animeTitles}
          onOpenDetails={(t) => setSelectedTitle(t)}
          onExplore={() => navigate('/browse/genre?id=anime')}
        />
      </div>

      {/* Modal Detail Overlay */}
      <TitleDetailModal
        title={selectedTitle}
        onClose={() => setSelectedTitle(null)}
        onSelectTitle={(newTitle) => setSelectedTitle(newTitle)}
      />
    </div>
  );
};
