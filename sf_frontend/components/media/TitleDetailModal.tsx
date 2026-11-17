import React, { useState, useEffect, useRef } from 'react';
import { Title } from '../../types';
import { useAuth } from '../../lib/auth/authContext';
import { streamFlixApi } from '../../lib/api/mockClient';
import { motion } from 'motion/react';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Film,
  Sparkles,
  Download,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDuration } from '../../lib/utils/formatters';
import {
  extractYoutubeId,
  resolvePlayableDirectVideo,
  getNextFallbackVideo,
} from '../../lib/utils/video';
import { MoviePosterImage } from '../ui/MoviePosterImage';

interface TitleDetailModalProps {
  title: Title | null;
  onClose: () => void;
  onSelectTitle: (title: Title) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  title,
  onClose,
  onSelectTitle,
}) => {
  const { navigate, isInMyList, toggleMyList, isLiked, toggleLike, isDisliked, toggleDislike, addToast } =
    useAuth();

  const [resolvedTitle, setResolvedTitle] = useState<Title | null>(title);
  const [activeTab, setActiveTab] = useState<'overview' | 'episodes' | 'similar' | 'details' | 'cast'>(
    'overview'
  );
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [similarTitles, setSimilarTitles] = useState<Title[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [playerMode, setPlayerMode] = useState<'trailer' | 'sample'>('trailer');
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [playbackCycle, setPlaybackCycle] = useState(0);
  const [directStreamUrl, setDirectStreamUrl] = useState(() =>
    resolvePlayableDirectVideo(
      title?.videoStreamUrl,
      title?.trailerVideoUrl || title?.trailerUrl,
      title?.id || 'modal-default'
    )
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handshakeRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMutedRef = useRef(isMuted);

  const activeTitle = resolvedTitle || title;
  const candidateTrailerForEffect =
    activeTitle?.trailerVideoUrl || activeTitle?.trailerUrl || activeTitle?.videoStreamUrl;
  const ytIdForEffect = extractYoutubeId(candidateTrailerForEffect);
  const modalIframeDomId = `modal-yt-${ytIdForEffect || 'none'}-${playbackCycle}`;

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    let mounted = true;
    if (!title) {
      setResolvedTitle(null);
      return;
    }

    setResolvedTitle(title);
    setPlayerMode('trailer');
    setIsMediaReady(false);
    setPlaybackCycle(0);
    setDirectStreamUrl(
      resolvePlayableDirectVideo(
        title.videoStreamUrl,
        title.trailerVideoUrl || title.trailerUrl,
        title.id
      )
    );
    setSelectedSeason(1);
    setActiveTab(title.type === 'series' && title.episodes?.length ? 'episodes' : 'overview');
    document.body.style.overflow = 'hidden';

    // Hydrate full details (official YouTube trailer + complete cast) in background
    streamFlixApi
      .getTitleById(title.id)
      .then((hydrated) => {
        if (!mounted || !hydrated) return;
        setResolvedTitle(hydrated);
        setDirectStreamUrl(
          resolvePlayableDirectVideo(
            hydrated.videoStreamUrl,
            hydrated.trailerVideoUrl || hydrated.trailerUrl,
            hydrated.id
          )
        );
      })
      .catch(() => {});

    streamFlixApi.getMoreLikeThis(title.id, 6).then((list) => {
      if (mounted) setSimilarTitles(list);
    });

    return () => {
      mounted = false;
      document.body.style.overflow = '';
    };
  }, [title]);

  // Listen to YouTube postMessage for silent loop (without playlist= prev/next controls) & fallback
  useEffect(() => {
    if (!title || !ytIdForEffect || playerMode !== 'trailer') return;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current?.contentWindow) return;
      if (
        event.source !== iframeRef.current.contentWindow &&
        !String(event.origin).includes('youtube')
      ) {
        return;
      }
      if (typeof event.data !== 'string') return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.id && payload.id !== modalIframeDomId) return;

        if (handshakeRetryRef.current) {
          clearInterval(handshakeRetryRef.current);
          handshakeRetryRef.current = null;
        }

        if (payload.event === 'onError') {
          setIsMediaReady(false);
          setPlayerMode('sample');
          return;
        }

        const state =
          payload.event === 'onStateChange'
            ? payload.info
            : payload.event === 'infoDelivery'
            ? payload.info?.playerState
            : undefined;

        if (state === 1) {
          if (readyTimerRef.current) {
            clearTimeout(readyTimerRef.current);
            readyTimerRef.current = null;
          }
          setIsMediaReady(true);
          if (!isMutedRef.current) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
              '*'
            );
          }
        } else if (state === 0) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
      if (handshakeRetryRef.current) {
        clearInterval(handshakeRetryRef.current);
        handshakeRetryRef.current = null;
      }
    };
  }, [title, ytIdForEffect, playerMode, modalIframeDomId]);

  // Synchronize mute/unmute without reloading YouTube trailer iframe
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: isMuted ? 'mute' : 'unMute', args: [] }),
        '*'
      );
    }
  }, [isMuted, isMediaReady]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = () => {
    if (!activeTitle) return;
    try {
      const stored = localStorage.getItem('streamflix_offline_downloads_v1');
      const list = stored ? JSON.parse(stored) : [];
      if (!list.some((d: any) => d.titleId === activeTitle.id)) {
        list.unshift({
          id: `dl-${Date.now()}`,
          titleId: activeTitle.id,
          title: activeTitle.title,
          posterUrl: activeTitle.posterUrl || activeTitle.backdropUrl,
          backdropUrl: activeTitle.backdropUrl,
          quality: activeTitle.qualities[0] || '4K Ultra HD',
          sizeBytes: Math.floor(Math.random() * 1500000000) + 1500000000,
          downloadedAt: 'Downloaded just now',
          durationMinutes: activeTitle.durationMinutes || 120,
          maturityRating: activeTitle.maturityRating,
          type: activeTitle.type,
          synopsis: activeTitle.synopsis,
        });
        localStorage.setItem('streamflix_offline_downloads_v1', JSON.stringify(list));
      }
      addToast({
        title: 'Downloaded for Offline Watching',
        description: `"${activeTitle.title}" is now available in your Downloads library.`,
        type: 'success',
      });
    } catch {
      // ignore
    }
  };

  if (!activeTitle) return null;

  const inList = isInMyList(activeTitle.id);
  const liked = isLiked(activeTitle.id);
  const disliked = isDisliked(activeTitle.id);

  const filteredEpisodes =
    activeTitle.episodes?.filter((ep) => ep.seasonNumber === selectedSeason) || [];

  const candidateTrailer =
    activeTitle.trailerVideoUrl || activeTitle.trailerUrl || activeTitle.videoStreamUrl;
  const ytId = extractYoutubeId(candidateTrailer);
  const showYoutubeTrailer = Boolean(ytId && playerMode === 'trailer');

  const handleReplay = () => {
    if (showYoutubeTrailer) {
      setIsMediaReady(false);
      setPlaybackCycle((c) => c + 1);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={activeTitle.title}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative w-full max-w-4xl min-h-[100dvh] sm:min-h-0 sm:h-auto bg-[#14141a] rounded-none sm:rounded-2xl overflow-hidden shadow-2xl border-0 sm:border border-white/10 my-0 sm:my-8 text-white flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Sticky/floating at top right */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer shadow-lg border border-white/15"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop with Autoplaying Trailer & Scrim */}
        <div className="relative aspect-[16/10] sm:aspect-video sm:h-[420px] w-full overflow-hidden shrink-0 bg-black">
          {/* Base Backdrop / Poster image (remains underneath until video starts playing cleanly) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <MoviePosterImage
              src={activeTitle.backdropUrl || activeTitle.posterUrl}
              alt={activeTitle.title}
              aspect="banner"
              className="w-full h-full filter brightness-[0.82]"
              objectFit="cover"
            />
          </div>

          {/* Autoplaying Trailer Video Layer */}
          {showYoutubeTrailer && ytId ? (
            <div
              className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden scale-[1.2] transition-opacity duration-500 ${
                isMediaReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <iframe
                id={modalIframeDomId}
                key={`yt-${ytId}-${playbackCycle}`}
                ref={iframeRef}
                title={`${activeTitle.title} official trailer`}
                src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1${
                  typeof window !== 'undefined' && window.location?.origin
                    ? `&origin=${encodeURIComponent(window.location.origin)}`
                    : ''
                }`}
                onLoad={() => {
                  const send = () => {
                    const win = iframeRef.current?.contentWindow;
                    if (!win) return;
                    win.postMessage(
                      JSON.stringify({ event: 'listening', id: modalIframeDomId, channel: 'widget' }),
                      '*'
                    );
                    win.postMessage(
                      JSON.stringify({
                        event: 'command',
                        func: 'addEventListener',
                        args: ['onStateChange'],
                      }),
                      '*'
                    );
                    win.postMessage(
                      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }),
                      '*'
                    );
                  };
                  send();
                  let attempts = 0;
                  if (handshakeRetryRef.current) clearInterval(handshakeRetryRef.current);
                  handshakeRetryRef.current = setInterval(() => {
                    attempts += 1;
                    if (attempts >= 5) {
                      if (handshakeRetryRef.current) {
                        clearInterval(handshakeRetryRef.current);
                        handshakeRetryRef.current = null;
                      }
                      return;
                    }
                    send();
                  }, 350);
                  readyTimerRef.current = setTimeout(() => setIsMediaReady(true), 1200);
                }}
                tabIndex={-1}
                className="w-full h-full object-cover border-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{
                  width: '100vw',
                  height: '56.25vw',
                  minHeight: '100%',
                  minWidth: '177.77vh',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          ) : (
            <video
              key={`mp4-${activeTitle.id}-${directStreamUrl}-${playbackCycle}`}
              ref={videoRef}
              src={directStreamUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              disablePictureInPicture
              controlsList="nodownload noplaybackrate noremoteplayback"
              preload="auto"
              onCanPlay={() => setIsMediaReady(true)}
              onPlaying={() => setIsMediaReady(true)}
              onError={() => {
                const nextUrl = getNextFallbackVideo(directStreamUrl);
                if (nextUrl) {
                  setDirectStreamUrl(nextUrl);
                } else {
                  setIsMediaReady(false);
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-[0.88] transition-opacity duration-500 ${
                isMediaReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Cinematic Scrims */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#14141a] via-[#14141a]/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#14141a]/70 to-transparent pointer-events-none" />

          {/* Top-Left Trailer Mode & Source Switcher Bar */}
          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-6 z-30 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold tracking-wider text-white shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse" />
              <span>{showYoutubeTrailer ? 'OFFICIAL TRAILER' : 'PREVIEW STREAM'}</span>
            </div>

            {ytId && (
              <div className="flex items-center bg-black/75 backdrop-blur-sm border border-white/20 rounded-md p-0.5 shadow">
                <button
                  type="button"
                  onClick={() => {
                    setIsMediaReady(false);
                    setPlayerMode('trailer');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                    playerMode === 'trailer'
                      ? 'bg-[#e50914] text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Trailer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMediaReady(false);
                    setPlayerMode('sample');
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer ${
                    playerMode === 'sample'
                      ? 'bg-[#e50914] text-white'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>Clip</span>
                </button>
              </div>
            )}
          </div>

          {/* Top-Right Video Action Buttons: Replay, Fullscreen Trailer, Audio Toggle */}
          <div className="absolute top-3.5 right-14 sm:top-4 sm:right-16 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={handleReplay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 bg-black/65 hover:bg-black/85 flex items-center justify-center text-white transition-all backdrop-blur-sm cursor-pointer shadow-lg"
              aria-label="Replay trailer"
              title="Replay trailer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/watch/${activeTitle.id}${ytId ? '?mode=trailer' : ''}`);
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/25 bg-black/65 hover:bg-black/85 flex items-center justify-center text-white transition-all backdrop-blur-sm cursor-pointer shadow-lg"
              aria-label="Expand trailer to fullscreen"
              title="Fullscreen Trailer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-black/65 hover:bg-black/85 flex items-center justify-center text-white transition-all backdrop-blur-sm cursor-pointer shadow-lg"
              aria-label={isMuted ? 'Unmute trailer audio' : 'Mute trailer audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Row inside Backdrop */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20 flex flex-wrap items-end justify-between gap-3 sm:gap-4">
            <div className="space-y-2.5 sm:space-y-3">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
                {activeTitle.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => {
                    onClose();
                    navigate(`/watch/${activeTitle.id}`);
                  }}
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                  className="px-5 sm:px-6"
                >
                  Play
                </Button>
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => {
                    onClose();
                    navigate(`/watch/${activeTitle.id}${ytId ? '?mode=trailer' : ''}`);
                  }}
                  leftIcon={<Film className="w-4 h-4 text-[#e50914]" />}
                  className="px-4 sm:px-5"
                >
                  Watch Trailer
                </Button>
                <button
                  onClick={() => toggleMyList(activeTitle.id)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/40 bg-black/50 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={inList ? 'Remove from My List' : 'Add to My List'}
                >
                  {inList ? <Check className="w-4 h-4 text-[#46d369]" /> : <Plus className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => toggleLike(activeTitle.id)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/40 bg-black/50 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="I like this"
                >
                  <ThumbsUp className={`w-4 h-4 ${liked ? 'text-[#e50914] fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => toggleDislike(activeTitle.id)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/40 bg-black/50 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Not for me"
                >
                  <ThumbsDown className={`w-4 h-4 ${disliked ? 'text-[#e50914] fill-current' : ''}`} />
                </button>
                <button
                  onClick={handleDownload}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/40 bg-black/50 hover:border-white text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Download for offline watching"
                  title="Download for offline watching"
                >
                  <Download className="w-4 h-4 text-sky-400" />
                </button>
              </div>
            </div>

            <div className="text-xs text-neutral-300 flex items-center gap-2">
              <span className="border border-white/30 px-1 py-0.5 rounded text-[11px] font-bold text-white">
                {activeTitle.maturityRating}
              </span>
              <span>{activeTitle.qualities.slice(0, 2).join(' · ')}</span>
            </div>
          </div>
        </div>

        {/* Details & Navigation Tabs */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-white/10">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium">
                <span className="text-[#46d369] font-bold">{activeTitle.matchScore}% Match</span>
                <span aria-hidden="true">·</span>
                <span>{activeTitle.releaseYear}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDuration(activeTitle.durationMinutes, activeTitle.totalSeasons)}</span>
                <span aria-hidden="true">·</span>
                <span className="text-white border border-white/30 px-1 rounded text-[10px]">HD</span>
              </div>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
                {activeTitle.synopsis}
              </p>
              {activeTitle.tagline && (
                <p className="text-xs sm:text-sm italic text-neutral-400">"{activeTitle.tagline}"</p>
              )}
            </div>

            {/* Right sidebar: Cast & Genres */}
            <div className="text-xs space-y-2 text-neutral-400">
              <div>
                <span className="text-neutral-500">Cast: </span>
                <span className="text-neutral-200">
                  {activeTitle.cast.map((c) => c.name).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Genres: </span>
                <span className="text-neutral-200">{activeTitle.genres.join(', ')}</span>
              </div>
              <div>
                <span className="text-neutral-500">Directors: </span>
                <span className="text-neutral-200">{activeTitle.directors.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
            {activeTitle.type === 'series' && activeTitle.episodes && activeTitle.episodes.length > 0 && (
              <button
                onClick={() => setActiveTab('episodes')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                  activeTab === 'episodes'
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Episodes
              </button>
            )}
            <button
              onClick={() => setActiveTab('similar')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'similar' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              More Like This
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'details' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Details & Audio
            </button>
            <button
              onClick={() => setActiveTab('cast')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-colors cursor-pointer shrink-0 ${
                activeTab === 'cast' ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cast & Crew ({activeTitle.cast?.length || 0})
            </button>
          </div>

          {/* Tab Content 1: Episodes for Series */}
          {activeTab === 'episodes' && activeTitle.episodes && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Episodes</h3>
                {activeTitle.totalSeasons && activeTitle.totalSeasons > 1 && (
                  <div className="relative inline-block">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-[#1f1f28] text-white text-xs px-3 py-1.5 rounded border border-white/20 focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: activeTitle.totalSeasons }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Season {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {filteredEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      onClose();
                      navigate(`/watch/${activeTitle.id}?ep=${ep.id}`);
                    }}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-colors"
                  >
                    <div className="relative aspect-video w-full sm:w-36 shrink-0 rounded overflow-hidden bg-neutral-800">
                      <img
                        src={ep.thumbnail}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span>
                          {ep.episodeNumber}. {ep.title}
                        </span>
                        <span className="text-neutral-400 tabular-nums">{ep.duration}m</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {ep.synopsis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 2: More Like This */}
          {activeTab === 'similar' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {similarTitles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectTitle(item)}
                  className="group rounded-md overflow-hidden bg-[#1f1f28] border border-white/5 cursor-pointer hover:border-white/20 transition-all hover:scale-102"
                >
                  <div className="aspect-video w-full relative">
                    <img
                      src={item.backdropUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 text-[10px] bg-black/60 px-1 rounded text-white font-mono">
                      {item.maturityRating}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-[#46d369] font-bold mb-1">
                      {item.matchScore}% Match
                    </p>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">
                      {item.synopsis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 3: Full Details & Audio/Subtitles */}
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">About {activeTitle.title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-neutral-300">
                <div>
                  <p className="text-neutral-500 font-semibold mb-1">Audio Languages</p>
                  <p>{activeTitle.audioLanguages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-semibold mb-1">Subtitles</p>
                  <p>{activeTitle.subtitleLanguages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-neutral-500 font-semibold mb-1">Maturity Rating</p>
                  <p>
                    Rated <span className="font-bold text-white">{activeTitle.maturityRating}</span> for
                    intense sequences, action, and language. Recommended for mature audiences.
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 font-semibold mb-1">Available Formats</p>
                  <p>4K Ultra HD, Dolby Vision, HDR10+, 5.1 Surround & Spatial Audio.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Cast & Crew Showcase with Profile Headshots */}
          {activeTab === 'cast' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Cast & Principal Characters</h3>
                <span className="text-xs text-neutral-400 font-mono">
                  {activeTitle.cast?.length || 0} Actors
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {activeTitle.cast?.map((actor) => (
                  <div
                    key={actor.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1c1c28] border border-white/10 hover:border-white/25 transition-all group"
                  >
                    {actor.profileUrl ? (
                      <img
                        src={actor.profileUrl}
                        alt={actor.name}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/20 shadow-md group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10">
                        {actor.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-white truncate">{actor.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{actor.character}</p>
                      <span className="text-[9px] uppercase tracking-wider text-[#e50914] font-semibold block mt-0.5">
                        {actor.role || 'Cast'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Directors & Production Crew */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-neutral-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                    Directed By
                  </p>
                  <p className="text-white font-medium">
                    {activeTitle.directors?.join(', ') || 'Studio Production'}
                  </p>
                </div>
                {activeTitle.creators && activeTitle.creators.length > 0 && (
                  <div>
                    <p className="text-neutral-500 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                      Created By
                    </p>
                    <p className="text-white font-medium">{activeTitle.creators.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
