import React, { useState, useRef, useEffect } from 'react';
import { Title, WatchProgress } from '../../types';
import { streamFlixApi } from '../../lib/api/mockClient';
import { MoviePosterImage } from '../ui/MoviePosterImage';
import {
  extractYoutubeId,
  resolvePlayableDirectVideo,
  getNextFallbackVideo,
} from '../../lib/utils/video';

interface PosterCardProps {
  title: Title;
  progress?: WatchProgress;
  onOpenDetails: (title: Title) => void;
  rank?: number;
  aspect?: 'poster' | 'backdrop';
  fillContainer?: boolean;
  className?: string;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  title,
  progress,
  onOpenDetails,
  rank,
  aspect = 'poster',
  fillContainer = false,
  className = '',
}) => {
  const [resolvedTitle, setResolvedTitle] = useState<Title>(title);
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [ytEmbedFailed, setYtEmbedFailed] = useState(false);
  const [directStreamUrl, setDirectStreamUrl] = useState(() =>
    resolvePlayableDirectVideo(
      title.videoStreamUrl,
      title.trailerVideoUrl || title.trailerUrl,
      title.id
    )
  );

  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handshakeRetryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isHoveredRef = useRef(false);

  const candidateTrailer = resolvedTitle.trailerVideoUrl || resolvedTitle.trailerUrl;
  const ytId = extractYoutubeId(candidateTrailer);
  const usingYoutubeTrailer = Boolean(ytId && !ytEmbedFailed);
  const iframeDomId = `card-yt-${title.id}`;

  // Sync local copy when card title prop changes
  useEffect(() => {
    setResolvedTitle(title);
    setYtEmbedFailed(false);
    setDirectStreamUrl(
      resolvePlayableDirectVideo(
        title.videoStreamUrl,
        title.trailerVideoUrl || title.trailerUrl,
        title.id
      )
    );
    setIsMediaReady(false);
  }, [title.id, title.trailerVideoUrl, title.videoStreamUrl]);

  const clearHoverTimers = () => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }
    if (iframeReadyTimerRef.current) {
      clearTimeout(iframeReadyTimerRef.current);
      iframeReadyTimerRef.current = null;
    }
    if (handshakeRetryRef.current) {
      clearInterval(handshakeRetryRef.current);
      handshakeRetryRef.current = null;
    }
  };

  // Start clean borderless preview after brief hover dwell so rapid mouse sweeps don't spam streams
  const handleMouseEnter = () => {
    clearHoverTimers();
    isHoveredRef.current = true;
    setIsHovered(true);
    setIsMediaReady(false);
    setYtEmbedFailed(false);

    hoverDelayRef.current = setTimeout(() => {
      if (!isHoveredRef.current) return;
      setShouldLoadPreview(true);

      // Enrich missing official YouTube trailer / cast in background for rich card & modal click
      if (!resolvedTitle.trailerVideoUrl?.includes('youtu') && resolvedTitle.id.startsWith('tmdb-')) {
        streamFlixApi
          .getTitleById(resolvedTitle.id)
          .then((hydrated) => {
            if (hydrated && isHoveredRef.current) {
              setResolvedTitle(hydrated);
              setDirectStreamUrl(
                resolvePlayableDirectVideo(
                  hydrated.videoStreamUrl,
                  hydrated.trailerVideoUrl || hydrated.trailerUrl,
                  hydrated.id
                )
              );
            }
          })
          .catch(() => {});
      }
    }, 180);
  };

  const handleMouseLeave = () => {
    isHoveredRef.current = false;
    clearHoverTimers();
    setIsHovered(false);
    setShouldLoadPreview(false);
    setIsMediaReady(false);
  };

  // Keep muted HTML5 preview playing cleanly on hover
  useEffect(() => {
    if (videoRef.current && isHovered && shouldLoadPreview && !usingYoutubeTrailer) {
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [isHovered, shouldLoadPreview, usingYoutubeTrailer, directStreamUrl]);

  const sendYoutubeHandshake = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: 'listening', id: iframeDomId, channel: 'widget' }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onError'] }), '*');
  };

  // Listen to YouTube postMessage only to loop silently (without playlist= prev/next UI) & recover on embed errors
  useEffect(() => {
    if (!isHovered || !shouldLoadPreview || !usingYoutubeTrailer || !ytId) return;

    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current?.contentWindow) return;
      if (event.source !== iframeRef.current.contentWindow && !String(event.origin).includes('youtube')) {
        return;
      }
      if (typeof event.data !== 'string') return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.id && payload.id !== iframeDomId) return;

        if (handshakeRetryRef.current) {
          clearInterval(handshakeRetryRef.current);
          handshakeRetryRef.current = null;
        }

        if (payload.event === 'onError') {
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

        if (state === 1) {
          if (iframeReadyTimerRef.current) {
            clearTimeout(iframeReadyTimerRef.current);
            iframeReadyTimerRef.current = null;
          }
          setIsMediaReady(true);
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
    return () => window.removeEventListener('message', handleMessage);
  }, [isHovered, shouldLoadPreview, usingYoutubeTrailer, ytId, iframeDomId]);

  useEffect(() => {
    return () => {
      isHoveredRef.current = false;
      clearHoverTimers();
    };
  }, []);

  const originParam =
    typeof window !== 'undefined' && window.location?.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';

  return (
    <div
      className={`relative group select-none cursor-pointer ${
        fillContainer ? 'w-full' : 'shrink-0'
      } ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenDetails(resolvedTitle)}
    >
      <div className={`flex items-end ${fillContainer ? 'w-full' : ''}`}>
        {/* Ranked Top 10 Big Stylized Number (if applicable) */}
        {rank !== undefined && (
          <div className="select-none font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter leading-none text-[#1b1b22] stroke-white -mr-3 sm:-mr-4 z-10 font-mono pointer-events-none">
            <span
              style={{
                WebkitTextStroke: '2px #555566',
                color: '#0b0b0f',
              }}
            >
              {rank}
            </span>
          </div>
        )}

        {/* Card Container: Clean controller-free hover sample playback */}
        <div
          className={`relative rounded-md overflow-hidden bg-[#14141a] border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            fillContainer
              ? 'w-full aspect-[2/3]'
              : aspect === 'poster'
              ? 'aspect-[2/3] w-[130px] sm:w-[165px] md:w-[195px] lg:w-[220px]'
              : 'aspect-video w-[220px] sm:w-[260px] md:w-[300px]'
          } ${
            isHovered
              ? '-translate-y-1 shadow-lg shadow-black/80 border-white/30 z-10'
              : 'border-white/10 hover:border-white/20'
          }`}
          role="button"
          tabIndex={0}
          aria-label={`${resolvedTitle.title}, ${resolvedTitle.releaseYear}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDetails(resolvedTitle);
            }
          }}
        >
          {/* Artwork & Controller-Free Hover Trailer / Video Preview */}
          <div className="relative w-full h-full overflow-hidden bg-black">
            <MoviePosterImage
              src={
                aspect === 'backdrop'
                  ? resolvedTitle.backdropUrl || resolvedTitle.posterUrl
                  : resolvedTitle.posterUrl
              }
              alt={resolvedTitle.title}
              aspect={aspect}
              releaseYear={resolvedTitle.releaseYear}
              genres={resolvedTitle.genres}
              imgClassName={`transition-all duration-300 ease-out ${
                isHovered ? 'scale-105 brightness-90' : 'scale-100 opacity-100'
              }`}
            />

            {/* Pure Borderless Autoplaying Video / Trailer Mounted on Hover (Zero Controls) */}
            {isHovered && shouldLoadPreview && (
              usingYoutubeTrailer && ytId ? (
                <div
                  className={`absolute inset-0 overflow-hidden bg-black pointer-events-none transition-opacity duration-300 ${
                    isMediaReady ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <iframe
                    id={iframeDomId}
                    ref={iframeRef}
                    title={`${resolvedTitle.title} trailer preview`}
                    src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1${originParam}`}
                    onLoad={() => {
                      sendYoutubeHandshake();
                      let attempts = 0;
                      if (handshakeRetryRef.current) clearInterval(handshakeRetryRef.current);
                      handshakeRetryRef.current = setInterval(() => {
                        attempts += 1;
                        if (!isHoveredRef.current || attempts >= 5) {
                          if (handshakeRetryRef.current) {
                            clearInterval(handshakeRetryRef.current);
                            handshakeRetryRef.current = null;
                          }
                          return;
                        }
                        sendYoutubeHandshake();
                      }, 300);

                      iframeReadyTimerRef.current = setTimeout(() => {
                        if (isHoveredRef.current) setIsMediaReady(true);
                      }, 1200);
                    }}
                    className="border-0 pointer-events-none"
                    tabIndex={-1}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={
                      aspect === 'backdrop'
                        ? {
                            width: '132%',
                            height: '156%',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }
                        : {
                            width: '340%',
                            height: '142%',
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                          }
                    }
                  />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={directStreamUrl}
                  autoPlay
                  loop
                  muted
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
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
                    isMediaReady ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )
            )}

            {/* Minimal Non-Interactive Title Gradient Only (All Playback Controllers & Strip Hidden) */}
            {isHovered && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 z-10 pointer-events-none">
                  <p
                    className="font-bold text-[11px] sm:text-xs text-white truncate drop-shadow-md"
                    title={resolvedTitle.title}
                  >
                    {resolvedTitle.title}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Continue Watching Saved Progress Bar (when card is idle / not hovering sample playback) */}
          {!isHovered && progress && progress.progressPercent > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-700 z-10">
              <div
                className="h-full bg-[#e50914]"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
