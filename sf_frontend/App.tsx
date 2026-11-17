import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth/authContext';
import { TopNav } from './components/layout/TopNav';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/ui/ToastContainer';
import { LandingPage } from './components/views/LandingPage';
import { LoginPage } from './components/views/LoginPage';
import { SignupPage } from './components/views/SignupPage';
import { ForgotPasswordPage } from './components/views/ForgotPasswordPage';
import { ResetPasswordPage } from './components/views/ResetPasswordPage';
import { ChangePasswordPage } from './components/views/ChangePasswordPage';
import { PricingPage } from './components/views/PricingPage';
import { BrowsePage } from './components/views/BrowsePage';
import { GenrePage } from './components/views/GenrePage';
import { SearchPage } from './components/views/SearchPage';
import { MyListPage } from './components/views/MyListPage';
import { ProfilesPage } from './components/views/ProfilesPage';
import { AccountPage } from './components/views/AccountPage';
import { ManageProfilesPage } from './components/views/ManageProfilesPage';
import { ErrorPage } from './components/views/ErrorPage';
import { PrivacyPolicyPage } from './components/views/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/views/TermsOfServicePage';
import { RefundPolicyPage } from './components/views/RefundPolicyPage';
import { CookiePolicyPage } from './components/views/CookiePolicyPage';
import { ParentalControlsPage } from './components/views/ParentalControlsPage';
import { DownloadsPage } from './components/views/DownloadsPage';
import { PodcastCenterPage } from './components/views/PodcastCenterPage';
import { AdminDashboardPage } from './components/views/AdminDashboardPage';
import { CookieConsentBanner } from './components/ui/CookieConsentBanner';
import { PlayerShell } from './components/media/PlayerShell';
import { TitleDetailModal } from './components/media/TitleDetailModal';
import { AudioPlayerBar } from './components/media/AudioPlayerBar';
import { UploadMediaModal } from './components/media/UploadMediaModal';
import { streamFlixApi } from './lib/api/mockClient';
import { MOCK_TITLES } from './lib/api/mockData';
import { Title, PodcastEpisode } from './types';

// Dedicated Fullscreen Cinema Watch Player Component
const WatchPlayerContainer: React.FC<{
  titleId: string;
  episodeId?: string;
  initialMode?: 'stream' | 'trailer';
  onExit: () => void;
}> = ({ titleId, episodeId, initialMode, onExit }) => {
  const [title, setTitle] = useState<Title | null>(() => {
    return MOCK_TITLES.find((t) => t.id === titleId) || null;
  });
  const [loading, setLoading] = useState(!title);

  useEffect(() => {
    let active = true;
    streamFlixApi
      .getTitleById(titleId)
      .then((found) => {
        if (!active) return;
        if (found) {
          setTitle(found);
          setLoading(false);
        } else {
          streamFlixApi.getFeaturedBillboard().then((fallback) => {
            if (!active) return;
            setTitle(fallback || MOCK_TITLES[0]!);
            setLoading(false);
          });
        }
      })
      .catch(() => {
        if (active) {
          setTitle(MOCK_TITLES[0]!);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [titleId]);

  if (loading || !title) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0b0b0f] flex flex-col items-center justify-center text-white select-none">
        <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold tracking-widest uppercase text-xs sm:text-sm text-neutral-300">
          Loading Stream Flix Cinema...
        </p>
      </div>
    );
  }

  return <PlayerShell title={title} episodeId={episodeId} initialMode={initialMode} onExit={onExit} />;
};

const MainRouter: React.FC = () => {
  const { currentPath, isAuthenticated, isAuthLoading, navigate } = useAuth();
  const [directTitleModal, setDirectTitleModal] = useState<Title | null>(null);
  const [activePodcast, setActivePodcast] = useState<PodcastEpisode | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Clean route path without query params + extract watch query params (?ep=...&mode=trailer)
  const [rawBasePath, rawQuery = ''] = currentPath.split('?');
  const basePath = rawBasePath || '/';
  const watchParams = new URLSearchParams(rawQuery);
  const watchEpisodeId = watchParams.get('ep') || undefined;
  const watchInitialMode = watchParams.get('mode') === 'trailer' ? 'trailer' : 'stream';

  // Direct /title/:id route detection
  useEffect(() => {
    if (basePath.startsWith('/title/')) {
      const titleId = basePath.replace('/title/', '');
      streamFlixApi.getTitleById(titleId).then((t) => {
        if (t) setDirectTitleModal(t);
      });
    } else {
      setDirectTitleModal(null);
    }
  }, [basePath]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Restoring your session...
        </p>
      </div>
    );
  }

  // If on watch route e.g. /watch/tmdb-movie-27205?mode=trailer, render full-screen player immediately
  if (basePath.startsWith('/watch/')) {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    const titleId = basePath.replace('/watch/', '');
    return (
      <WatchPlayerContainer
        titleId={titleId}
        episodeId={watchEpisodeId}
        initialMode={watchInitialMode}
        onExit={() => navigate('/browse')}
      />
    );
  }

  // Determine which page component to render
  const renderRoute = () => {
    // Public routes (accessible unauthenticated)
    if (basePath === '/' || basePath === '') {
      return isAuthenticated ? <BrowsePage /> : <LandingPage />;
    }
    if (basePath === '/login') {
      return <LoginPage />;
    }
    if (basePath === '/signup') {
      return <SignupPage />;
    }
    if (basePath === '/forgot-password') {
      return <ForgotPasswordPage />;
    }
    if (basePath === '/reset-password') {
      return <ResetPasswordPage />;
    }
    if (basePath === '/pricing') {
      return <PricingPage />;
    }
    if (basePath === '/privacy') {
      return <PrivacyPolicyPage />;
    }
    if (basePath === '/terms') {
      return <TermsOfServicePage />;
    }
    if (basePath === '/refund') {
      return <RefundPolicyPage />;
    }
    if (basePath === '/cookies') {
      return <CookiePolicyPage />;
    }
    if (basePath === '/parental-controls') {
      return <ParentalControlsPage />;
    }

    // Guarded Authenticated Routes
    if (!isAuthenticated) {
      return <LoginPage />;
    }

    if (basePath === '/browse') {
      return <BrowsePage />;
    }
    if (basePath === '/browse/movies') {
      return <BrowsePage filterType="movie" />;
    }
    if (basePath === '/browse/series') {
      return <BrowsePage filterType="series" />;
    }
    if (basePath === '/browse/new') {
      return <BrowsePage filterType="new" />;
    }
    if (basePath === '/browse/genre' || basePath.startsWith('/browse/genre/')) {
      return <GenrePage />;
    }
    if (basePath === '/search') {
      return <SearchPage />;
    }
    if (basePath === '/my-list') {
      return <MyListPage />;
    }
    if (basePath === '/profiles') {
      return <ProfilesPage />;
    }
    if (basePath === '/account') {
      return <AccountPage />;
    }
    if (basePath === '/change-password') {
      return <ChangePasswordPage />;
    }
    if (basePath === '/account/profiles') {
      return <ManageProfilesPage />;
    }
    if (basePath === '/downloads') {
      return <DownloadsPage />;
    }
    if (basePath === '/podcasts') {
      return (
        <PodcastCenterPage
          onPlayEpisode={(ep) => setActivePodcast(ep)}
          activeEpisodeId={activePodcast?.id}
        />
      );
    }
    if (basePath === '/control-portal' || basePath === '/admin-settings' || basePath === '/controller') {
      return <AdminDashboardPage />;
    }
    if (basePath === '/admin') {
      // Isolated admin path: automatically reroute to protected control-portal
      navigate('/control-portal');
      return null;
    }
    if (basePath.startsWith('/watch/')) {
      const titleId = basePath.replace('/watch/', '');
      return (
        <WatchPlayerContainer
          titleId={titleId}
          episodeId={watchEpisodeId}
          initialMode={watchInitialMode}
          onExit={() => navigate('/browse')}
        />
      );
    }
    if (basePath.startsWith('/title/')) {
      return <BrowsePage />;
    }

    // 404 Catch-all
    return <ErrorPage code={404} />;
  };

  const isAuthPage =
    basePath === '/login' ||
    basePath === '/signup' ||
    basePath === '/forgot-password' ||
    basePath === '/reset-password' ||
    basePath === '/profiles';

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white flex flex-col justify-between selection:bg-[#e50914] selection:text-white">
      {/* Top Navigation (rendered on all views except isolated auth/profiles screens) */}
      {!isAuthPage && <TopNav onOpenUpload={() => setIsUploadOpen(true)} />}

      {/* Main View Container */}
      <main className="flex-1 w-full">
        {renderRoute()}
      </main>

      {/* Direct Title Detail Modal if /title/:id was entered */}
      {directTitleModal && (
        <TitleDetailModal
          title={directTitleModal}
          onClose={() => {
            setDirectTitleModal(null);
            navigate('/browse');
          }}
          onSelectTitle={(t) => setDirectTitleModal(t)}
        />
      )}

      {/* Sticky Audio Player Bar for Podcasts */}
      <AudioPlayerBar
        episode={activePodcast}
        onClose={() => setActivePodcast(null)}
      />

      {/* Creator Studio Upload Modal */}
      <UploadMediaModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />

      {/* Global Toast Alerts */}
      <ToastContainer />

      {/* Global Footer (shown on landing, pricing, account, or browse) */}
      {!isAuthPage && <Footer />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
