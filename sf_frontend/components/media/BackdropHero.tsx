import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Title } from '../../types';
import { useAuth } from '../../lib/auth/authContext';
import { streamFlixApi } from '../../lib/api/mockClient';
import {
  Play,
  Info,
  Volume2,
  VolumeX,
  Check,
  Plus,
  Flame,
  Sparkles,
  Film,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { formatDuration } from '../../lib/utils/formatters';
import { motion, AnimatePresence } from 'motion/react';
import {
  extractYoutubeId,
  resolvePlayableDirectVideo,
  getNextFallbackVideo,
  isDeadVideoUrl,
} from '../../lib/utils/video';
import { MoviePosterImage } from '../ui/MoviePosterImage';

interface BackdropHeroProps {
  title?: Title;
  titles?: Title[];
  onOpenDetails: (title: Title) => void;
}

const CYCLE_DURATION_MS = 7500;
const STARTUP_WATCHDOG_MS = 9000;

export const BackdropHero: React.FC<BackdropHeroProps> = ({
  title,
  titles,
  onOpenDetails,
}) => {
  const { navigate, isInMyList, toggleMyList } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [isHydratingSlide, setIsHydratingSlide] = useState(false);
  const [ytEmbedFailed, setYtEmbedFailed] = useState(false);
  const [allDirectFailed, setAllDirectFailed] = useState(false);
  const [hydratedSlides, setHydratedSlides] = useState<Record<string, Title>>({});
  const [directStreamUrl, setDirectStreamUrl] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMutedRef = useRef(isMuted);
  const advancedSlideKeyRef = useRef<string | null>(null);
  const ytStartedRef = useRef(false);
  const ytStartupWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytHandshakeRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoStartupWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compile list of hero titles
  const heroTitles: Title[] =
    titles && titles.length > 0 ? titles : title ? [title] : [];

  const safeIndex = heroTitles.length > 0 ? currentIndex % heroTitles.length : 0;
  const baseActiveTitle = heroTitles[safeIndex];
  const activeTitle = baseActiveTitle
    ? hydratedSlides[baseActiveTitle.id] || baseActiveTitle
    : undefined;
  const activeSlideKey = activeTitle ? `${safeIndex}:${activeTitle.id}` : '';

  const clearHeroTimers = useCallback(() => {
    if (ytStartupWatchdogRef.current) {
      clearTimeout(ytStartupWatchdogRef.current);
      ytStartupWatchdogRef.current = null;
    }
    if (ytReadyTimerRef.current) {
      clearTimeout(ytReadyTimerRef.current);
      ytReadyTimerRef.current = null;
    }
    if (ytHandshakeRetryRef.current) {
      clearInterval(ytHandshakeRetryRef.current);
      ytHandshakeRetryRef.current = null;
    }
    if (videoStartupWatchdogRef.current) {
      clearTimeout(videoStartupWatchdogRef.current);
      videoStartupWatchdogRef.current = null;
    }
  }, []);

  const goToNext = useCallback(() => {
    if (heroTitles.length <= 1 || !activeSlideKey) return;
    if (advancedSlideKeyRef.current === activeSlideKey) return;
    advancedSlideKeyRef.current = activeSlideKey;
    clearHeroTimers();
    setCurrentIndex((curr) => (curr + 1) % heroTitles.length);
  }, [heroTitles.length, activeSlideKey, clearHeroTimers]);

  // Keep latest mute preference accessible in YouTube message listener
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Hydrate missing official trailer for current hero slide and reset playback state
  useEffect(() => {
    if (!baseActiveTitle) return;

    clearHeroTimers();
    advancedSlideKeyRef.current = null;
    ytStartedRef.current = false;
    setIsMediaReady(false);
    setYtEmbedFailed(false);
    setAllDirectFailed(false);

    const currentData = hydratedSlides[baseActiveTitle.id] || baseActiveTitle;
    const rawCandidate =
      currentData.trailerVideoUrl || currentData.trailerUrl || currentData.videoStreamUrl;
    const hasAnyStream = Boolean(rawCandidate && rawCandidate.trim() && !isDeadVideoUrl(rawCandidate));

    setDirectStreamUrl(
      hasAnyStream
        ? resolvePlayableDirectVideo(
            currentData.videoStreamUrl,
            currentData.trailerVideoUrl || currentData.trailerUrl,
            currentData.id
          )
        : ''
    );

    if (!currentData.trailerVideoUrl?.includes('youtu') && currentData.id.startsWith('tmdb-')) {
      let active = true;
      setIsHydratingSlide(true);
      const hydrationCap = setTimeout(() => {
        if (active) setIsHydratingSlide(false);
      }, 900);

      streamFlixApi
        .getTitleById(currentData.id)
        .then((hydrated) => {
          if (!active) return;
          if (hydrated) {
            setHydratedSlides((prev) => ({ ...prev, [currentData.id]: hydrated }));
            const nextRaw =
              hydrated.trailerVideoUrl || hydrated.trailerUrl || hydrated.videoStreamUrl;
            const hydratedHasStream = Boolean(nextRaw && nextRaw.trim() && !isDeadVideoUrl(nextRaw));
            setDirectStreamUrl(
              hydratedHasStream
                ? resolvePlayableDirectVideo(
                    hydrated.videoStreamUrl,
                    hydrated.trailerVideoUrl || hydrated.trailerUrl,
                    hydrated.id
                  )
                : ''
            );
          }
          clearTimeout(hydrationCap);
          setIsHydratingSlide(false);
        })
        .catch(() => {
          clearTimeout(hydrationCap);
          if (active) setIsHydratingSlide(false);
        });

      return () => {
        active = false;
        clearTimeout(hydrationCap);
      };
    }

    setIsHydratingSlide(false);
  }, [safeIndex, baseActiveTitle?.id]);

  // Cleanup timers on unmount
  useEffect(() => clearHeroTimers, [clearHeroTimers]);

  // Synchronize mute/unmute without restarting hero YouTube iframe
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

  const resolvedTrailer =
    activeTitle?.trailerVideoUrl || activeTitle?.trailerUrl || activeTitle?.videoStreamUrl || '';
  const youtubeId = extractYoutubeId(resolvedTrailer);
  const hasYoutubeTrailer = Boolean(youtubeId && !ytEmbedFailed);
  const rawStreamExists = Boolean(
    resolvedTrailer && resolvedTrailer.trim() && !isDeadVideoUrl(resolvedTrailer)
  );
  const effectiveVideoUrl =
    directStreamUrl ||
    (rawStreamExists && activeTitle
      ? resolvePlayableDirectVideo(
          activeTitle.videoStreamUrl,
          activeTitle.trailerVideoUrl || activeTitle.trailerUrl,
          activeTitle.id
        )
      : '');
  const hasDirectTrailer = Boolean(effectiveVideoUrl && !allDirectFailed);
  const shouldUseStandardTimer =
    !isHydratingSlide && !hasYoutubeTrailer && !hasDirectTrailer;

  const iframeDomId = activeTitle ? `hero-yt-${safeIndex}-${activeTitle.id}` : 'hero-yt';

  const sendYoutubeHandshake = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: 'listening', id: iframeDomId, channel: 'widget' }),
      '*'
    );
    win.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
      '*'
    );
    win.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }),
      '*'
    );
  }, [iframeDomId]);

  // Listen to YouTube events: allow full trailer playback to finish before advancing slide
  useEffect(() => {
    if (!activeTitle || !hasYoutubeTrailer || !youtubeId) return;

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
        if (payload.id && payload.id !== iframeDomId) return;

        if (ytHandshakeRetryRef.current) {
          clearInterval(ytHandshakeRetryRef.current);
          ytHandshakeRetryRef.current = null;
        }

        if (payload.event === 'onError') {
          clearHeroTimers();
          setIsMediaReady(false);
          setYtEmbedFailed(true);
          return;
        }

        const state =
          payload.event === 'onStateChange'
            ? payload.info
            : payload.event === 'infoDelivery'
            ? payload.info?.playerState
            : undefined;

        const duration = payload.event === 'infoDelivery' ? payload.info?.duration : undefined;
        const currentTime =
          payload.event === 'infoDelivery' ? payload.info?.currentTime : undefined;

        // Playing (1) or Buffering (3): trailer is alive -> cancel startup watchdog so full trailer finishes
        if (state === 1 || state === 3) {
          ytStartedRef.current = true;
          if (ytStartupWatchdogRef.current) {
            clearTimeout(ytStartupWatchdogRef.current);
            ytStartupWatchdogRef.current = null;
          }
          if (state === 1) {
            if (ytReadyTimerRef.current) {
              clearTimeout(ytReadyTimerRef.current);
              ytReadyTimerRef.current = null;
            }
            setIsMediaReady(true);
            if (!isMutedRef.current) {
              iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
                '*'
              );
            }
          }
        }

        const reachedEnd =
          state === 0 ||
          (ytStartedRef.current &&
            typeof duration === 'number' &&
            duration > 5 &&
            typeof currentTime === 'number' &&
            currentTime >= duration - 0.35);

        if (reachedEnd) {
          if (heroTitles.length <= 1) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
              '*'
            );
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
              '*'
            );
          } else {
            goToNext();
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);

    // Fail over cleanly ONLY if YouTube embed never starts buffering/playing
    ytStartupWatchdogRef.current = setTimeout(() => {
      if (!ytStartedRef.current) {
        setIsMediaReady(false);
        setYtEmbedFailed(true);
      }
    }, STARTUP_WATCHDOG_MS);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (ytStartupWatchdogRef.current) {
        clearTimeout(ytStartupWatchdogRef.current);
        ytStartupWatchdogRef.current = null;
      }
    };
  }, [activeTitle?.id, safeIndex, hasYoutubeTrailer, youtubeId, iframeDomId, heroTitles.length, goToNext, clearHeroTimers]);

  // Direct HTML5 <video> startup watchdog ONLY (cancelled once video plays; onEnded advances carousel)
  useEffect(() => {
    if (!activeTitle || isHydratingSlide || hasYoutubeTrailer || !hasDirectTrailer) return;

    videoStartupWatchdogRef.current = setTimeout(() => {
      const vid = videoRef.current;
      if (!vid || (vid.readyState < 2 && vid.paused)) {
        const nextUrl = getNextFallbackVideo(effectiveVideoUrl);
        if (nextUrl) {
          setDirectStreamUrl(nextUrl);
        } else {
          setIsMediaReady(false);
          setAllDirectFailed(true);
        }
      }
    }, STARTUP_WATCHDOG_MS);

    return () => {
      if (videoStartupWatchdogRef.current) {
        clearTimeout(videoStartupWatchdogRef.current);
        videoStartupWatchdogRef.current = null;
      }
    };
  }, [activeTitle?.id, safeIndex, isHydratingSlide, hasYoutubeTrailer, hasDirectTrailer, effectiveVideoUrl]);

  // Exception ONLY: use standard 7500ms timer if there is NO trailer (or playback failed completely)
  useEffect(() => {
    if (heroTitles.length <= 1 || !shouldUseStandardTimer) return;

    const timer = setTimeout(() => {
      goToNext();
    }, CYCLE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [heroTitles.length, shouldUseStandardTimer, activeSlideKey, goToNext]);

  if (!activeTitle) return null;

  const inList = isInMyList(activeTitle.id);
  const backdropSrc = activeTitle.backdropUrl || activeTitle.posterUrl;
  const originParam =
    typeof window !== 'undefined' && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';

  return (
    <div className="relative w-full h-[78vh] sm:h-[88vh] lg:h-[94vh] min-h-[500px] sm:min-h-[580px] overflow-hidden select-none group/hero">
      {/* Animated Cross-Fading & Subtle Sliding Backdrop / Auto-playing Trailer (Zero Transport Chrome) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${safeIndex}-${activeTitle.id}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full overflow-hidden bg-black"
        >
          {/* Base Backdrop / Poster image */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <MoviePosterImage
              src={backdropSrc}
              alt={activeTitle.title}
              aspect="banner"
              className="w-full h-full filter brightness-[0.82]"
              objectFit="cover"
            />
          </div>

          {/* Autoplaying Trailer Video Layer */}
          {hasYoutubeTrailer && youtubeId ? (
            <div
              className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden scale-[1.22] transition-opacity duration-500 ${
                isMediaReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <iframe
                id={iframeDomId}
                ref={iframeRef}
                title={`${activeTitle.title} trailer`}
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1${originParam}`}
                onLoad={() => {
                  sendYoutubeHandshake();
                  let attempts = 0;
                  if (ytHandshakeRetryRef.current) clearInterval(ytHandshakeRetryRef.current);
                  ytHandshakeRetryRef.current = setInterval(() => {
                    attempts += 1;
                    if (ytStartedRef.current || attempts >= 6) {
                      if (ytHandshakeRetryRef.current) {
                        clearInterval(ytHandshakeRetryRef.current);
                        ytHandshakeRetryRef.current = null;
                      }
                      return;
                    }
                    sendYoutubeHandshake();
                  }, 350);

                  ytReadyTimerRef.current = setTimeout(() => {
                    setIsMediaReady(true);
                  }, 1200);
                }}
                tabIndex={-1}
                className="w-full h-full object-cover border-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{
                  width: '100vw',
                  height: '56.25vw', // 16:9 ratio
                  minHeight: '100%',
                  minWidth: '177.77vh',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          ) : !isHydratingSlide && hasDirectTrailer ? (
            <video
              ref={videoRef}
              src={effectiveVideoUrl}
              autoPlay
              loop={heroTitles.length <= 1}
              muted={isMuted}
              playsInline
              disablePictureInPicture
              controlsList="nodownload noplaybackrate noremoteplayback"
              preload="auto"
              onCanPlay={() => {
                if (videoStartupWatchdogRef.current) {
                  clearTimeout(videoStartupWatchdogRef.current);
                  videoStartupWatchdogRef.current = null;
                }
                setIsMediaReady(true);
              }}
              onPlaying={() => {
                if (videoStartupWatchdogRef.current) {
                  clearTimeout(videoStartupWatchdogRef.current);
                  videoStartupWatchdogRef.current = null;
                }
                setIsMediaReady(true);
              }}
              onTimeUpdate={() => {
                if (videoStartupWatchdogRef.current) {
                  clearTimeout(videoStartupWatchdogRef.current);
                  videoStartupWatchdogRef.current = null;
                }
              }}
              onEnded={() => {
                if (heroTitles.length > 1) {
                  goToNext();
                }
              }}
              onError={() => {
                const nextUrl = getNextFallbackVideo(effectiveVideoUrl);
                if (nextUrl) {
                  setDirectStreamUrl(nextUrl);
                } else {
                  setIsMediaReady(false);
                  setAllDirectFailed(true);
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-[0.9] transition-opacity duration-500 ${
                isMediaReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Scrims */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/65 to-transparent w-full md:w-3/4 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0b0b0f]/80 to-transparent pointer-events-none" />

      {/* Audio preview toggle & Maturity Badge - Edge-pinned */}
      <div className="absolute top-20 sm:top-auto sm:bottom-32 md:bottom-36 lg:bottom-40 right-3 sm:right-0 z-20 flex items-center gap-2.5">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/30 bg-black/50 hover:border-white hover:bg-black/70 flex items-center justify-center text-white transition-all backdrop-blur-sm sm:mr-4 cursor-pointer"
          aria-label={isMuted ? 'Unmute preview audio' : 'Mute preview audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <div className="bg-[#14141a]/85 backdrop-blur-sm border-l-2 border-white/60 py-1 pl-2.5 pr-4 text-[11px] sm:text-xs text-neutral-300 font-bold">
          {activeTitle.maturityRating}
        </div>
      </div>

      {/* Hero Content Area: Title, Kicker, Details & CTAs */}
      <div className="absolute bottom-20 sm:bottom-28 md:bottom-36 lg:bottom-40 left-4 right-4 sm:right-auto sm:left-8 md:left-12 max-w-2xl z-20 space-y-2.5 sm:space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${safeIndex}-${activeTitle.id}`}
            initial={{ opacity: 0, x: -28 }}
            animate={{
              opacity: 1,
              x: 0,
              transition: {
                delay: 0.18,
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            exit={{
              opacity: 0,
              x: 28,
              transition: {
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              },
            }}
            className="space-y-2.5 sm:space-y-3.5"
          >
            {/* Top 10 or Original Kicker */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
              {activeTitle.isTop10 && (
                <div className="flex items-center gap-1.5 bg-[#e50914] text-white px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                  <Flame className="w-3.5 h-3.5" />
                  <span>#{activeTitle.top10Rank || 1} IN STREAM FLIX TODAY</span>
                </div>
              )}
              {activeTitle.isNewRelease && !activeTitle.isTop10 && (
                <div className="flex items-center gap-1.5 bg-emerald-600/90 text-white px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NEW RELEASE</span>
                </div>
              )}
              {activeTitle.isOriginal && !activeTitle.isTop10 && !activeTitle.isNewRelease && (
                <span className="text-[#e50914] font-extrabold uppercase tracking-widest text-[10px] sm:text-[11px]">
                  STREAM FLIX ORIGINAL
                </span>
              )}
            </div>

            {/* Title Heading */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] break-words drop-shadow-lg">
              {activeTitle.title}
            </h1>

            {/* Metadata Line */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm text-neutral-300 font-medium">
              <span className="text-[#46d369] font-bold">{activeTitle.matchScore}% Match</span>
              <span aria-hidden="true">·</span>
              <span>{activeTitle.releaseYear}</span>
              <span aria-hidden="true">·</span>
              <span className="border border-white/40 px-1 py-0.2 rounded text-[10px] sm:text-[11px] font-semibold">
                {activeTitle.maturityRating}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDuration(activeTitle.durationMinutes, activeTitle.totalSeasons)}</span>
              <span aria-hidden="true">·</span>
              <span className="border border-white/30 px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] text-neutral-300">
                {activeTitle.qualities[0] || '4K UHD'}
              </span>
            </div>

            {/* Tagline / Synopsis */}
            {activeTitle.tagline && (
              <p className="text-xs sm:text-sm font-semibold italic text-neutral-300 drop-shadow">
                "{activeTitle.tagline}"
              </p>
            )}
            <p className="text-xs sm:text-sm md:text-base text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
              {activeTitle.synopsis}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Action CTAs: ALWAYS on screen, NOT animated, permanent rock-solid position */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
          <Button
            size="md"
            variant="primary"
            onClick={() => navigate(`/watch/${activeTitle.id}`)}
            leftIcon={<Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
            className="flex-1 sm:flex-initial px-4 sm:px-7 h-10 sm:h-12 shadow-xl text-xs sm:text-base font-bold cursor-pointer"
          >
            Play Now
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => navigate(`/watch/${activeTitle.id}${youtubeId ? '?mode=trailer' : ''}`)}
            leftIcon={<Film className="w-4 h-4 sm:w-5 sm:h-5 text-[#e50914]" />}
            className="hidden sm:inline-flex px-4 sm:px-6 h-10 sm:h-12 text-xs sm:text-base font-medium cursor-pointer"
          >
            Trailer
          </Button>
          <Button
            size="md"
            variant="secondary"
            onClick={() => onOpenDetails(activeTitle)}
            leftIcon={<Info className="w-4 h-4 sm:w-5 sm:h-5" />}
            className="flex-1 sm:flex-initial px-4 sm:px-6 h-10 sm:h-12 text-xs sm:text-base font-medium cursor-pointer"
          >
            More Info
          </Button>
          <button
            onClick={() => toggleMyList(activeTitle.id)}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/40 bg-black/40 hover:border-white hover:bg-black/60 active:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer shrink-0"
            aria-label={inList ? 'Remove from My List' : 'Add to My List'}
          >
            {inList ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#46d369]" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
