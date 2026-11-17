import React, { useState, useEffect, useRef } from 'react';
import { Title } from '../../types';
import { useAuth } from '../../lib/auth/authContext';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Subtitles,
  Film,
  Sparkles,
} from 'lucide-react';
import { formatPlayerTime } from '../../lib/utils/formatters';
import {
  extractYoutubeId,
  resolvePlayableDirectVideo,
  getNextFallbackVideo,
} from '../../lib/utils/video';

interface PlayerShellProps {
  title: Title;
  episodeId?: string;
  initialMode?: 'stream' | 'trailer';
  onExit: () => void;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({
  title,
  episodeId,
  initialMode,
  onExit,
}) => {
  const { updateWatchProgress, user } = useAuth();

  const currentEpisode = title.episodes?.find((ep) => ep.id === episodeId) || title.episodes?.[0];
  const totalSeconds = title.durationMinutes
    ? title.durationMinutes * 60
    : currentEpisode
    ? currentEpisode.duration * 60
    : 5400; // default 90m

  const savedProgress = user?.watchHistory.find((w) => w.titleId === title.id);
  const initialSeconds = savedProgress ? savedProgress.lastWatchedSeconds : 0;

  const youtubeId = extractYoutubeId(title.trailerVideoUrl || title.trailerUrl);
  const resolvedInitialMode: 'stream' | 'trailer' =
    initialMode === 'trailer' && youtubeId ? 'trailer' : 'stream';

  const [playerMode, setPlayerMode] = useState<'stream' | 'trailer'>(resolvedInitialMode);
  const [directVideoUrl, setDirectVideoUrl] = useState(() =>
    resolvePlayableDirectVideo(
      title.videoStreamUrl,
      title.trailerVideoUrl || title.trailerUrl,
      title.id
    )
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed] = useState(1);
  const [quality] = useState('4K Ultra HD');
  const [selectedSubtitle] = useState('Off');
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverSeekSeconds, setHoverSeekSeconds] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDirectVideoUrl(
      resolvePlayableDirectVideo(
        title.videoStreamUrl,
        title.trailerVideoUrl || title.trailerUrl,
        title.id
      )
    );
  }, [title.id, title.videoStreamUrl, title.trailerVideoUrl, title.trailerUrl]);

  useEffect(() => {
    if (initialMode === 'trailer' && youtubeId) {
      setPlayerMode('trailer');
    }
  }, [initialMode, youtubeId]);

  // Synchronize HTML5 video element with state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || playerMode !== 'stream') return;

    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser blocked unmuted autoplay, mute and immediately play
          if (err.name === 'NotAllowedError') {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          }
        });
      }
    } else {
      video.pause();
    }
  }, [isPlaying, playerMode, directVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = isMuted ? 0 : volume;
    video.playbackRate = playbackSpeed;
  }, [volume, isMuted, playbackSpeed]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const current = video.currentTime;
    setCurrentSeconds(current);

    if (Math.floor(current) % 5 === 0 && totalSeconds > 0) {
      const percent = (current / totalSeconds) * 100;
      updateWatchProgress(title.id, percent, Math.floor(current), totalSeconds, currentEpisode?.id);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSubtitlesMenu(false);
        setShowSettingsMenu(false);
      }
    }, 3500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
        handleMouseMove();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekBy(-10);
        handleMouseMove();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekBy(10);
        handleMouseMove();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted((m) => !m);
        handleMouseMove();
      } else if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, totalSeconds]);

  const seekBy = (deltaSeconds: number) => {
    const video = videoRef.current;
    if (video) {
      const target = Math.max(0, Math.min(video.duration || totalSeconds, video.currentTime + deltaSeconds));
      video.currentTime = target;
      setCurrentSeconds(target);
      const percent = (target / totalSeconds) * 100;
      updateWatchProgress(title.id, percent, Math.floor(target), totalSeconds, currentEpisode?.id);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = ratio * totalSeconds;

    const video = videoRef.current;
    if (video) {
      video.currentTime = targetSeconds;
    }
    setCurrentSeconds(targetSeconds);
    const percent = (targetSeconds / totalSeconds) * 100;
    updateWatchProgress(title.id, percent, Math.floor(targetSeconds), totalSeconds, currentEpisode?.id);
  };

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverSeekSeconds(ratio * totalSeconds);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const progressPercent = totalSeconds > 0 ? (currentSeconds / totalSeconds) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none group"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Real Video Player or Embedded Trailer */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {playerMode === 'trailer' && youtubeId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=${
              isMuted ? 1 : 0
            }&controls=1&enablejsapi=1&playsinline=1&rel=0`}
            title={`${title.title} Official Trailer`}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={directVideoUrl}
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onClick={() => setIsPlaying(!isPlaying)}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              const nextUrl = getNextFallbackVideo(directVideoUrl);
              if (nextUrl) setDirectVideoUrl(nextUrl);
            }}
            poster={title.backdropUrl}
            className="w-full h-full object-contain cursor-pointer"
          />
        )}

        {/* Subtitles Overlay */}
        {selectedSubtitle !== 'Off' && playerMode === 'stream' && (
          <div className="absolute bottom-28 left-0 right-0 text-center pointer-events-none px-6 z-20">
            <span className="bg-black/85 text-yellow-100 font-semibold text-base sm:text-2xl px-4 py-1.5 rounded-md shadow-2xl tracking-wide border border-black/50">
              {isPlaying
                ? `[${title.title}] ${title.synopsis.slice(0, 80)}...`
                : '[Playback paused - Space to resume]'}
            </span>
          </div>
        )}

        {/* Center Pause Indicator */}
        {!isPlaying && playerMode === 'stream' && (
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white pointer-events-auto cursor-pointer animate-scale-in z-20"
          >
            <Play className="w-9 h-9 fill-current ml-1" />
          </div>
        )}
      </div>

      {/* Top Header Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/95 via-black/60 to-transparent transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={onExit}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shrink-0"
            aria-label="Back to browse"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">
              {title.title}
            </h1>
            {currentEpisode ? (
              <p className="text-xs sm:text-sm text-neutral-400 truncate">
                S{currentEpisode.seasonNumber}:E{currentEpisode.episodeNumber} "{currentEpisode.title}"
              </p>
            ) : (
              <p className="text-xs text-neutral-400 truncate">
                {title.releaseYear} · {title.genres.slice(0, 2).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Stream Source Toggle (Feature Stream vs Official Trailer) */}
        <div className="flex items-center gap-2 shrink-0">
          {youtubeId && (
            <div className="flex items-center bg-black/60 border border-white/20 rounded-lg p-0.5 backdrop-blur-sm">
              <button
                onClick={() => setPlayerMode('stream')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  playerMode === 'stream' ? 'bg-[#e50914] text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Feature Stream</span>
              </button>
              <button
                onClick={() => setPlayerMode('trailer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  playerMode === 'trailer' ? 'bg-[#e50914] text-white shadow' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Official 4K Trailer</span>
              </button>
            </div>
          )}

          <span className="hidden sm:inline-block text-xs px-2 py-1 rounded bg-white/15 text-white font-mono uppercase font-bold border border-white/10">
            {quality}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-white/10 text-neutral-300 font-mono font-bold border border-white/10">
            {title.maturityRating}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      {playerMode === 'stream' && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/75 to-transparent transition-opacity duration-300 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Scrubbable Timeline */}
          <div
            className="relative w-full h-3 flex items-center cursor-pointer group/timeline mb-3 sm:mb-4"
            onClick={handleTimelineClick}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={() => setHoverSeekSeconds(null)}
          >
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden group-hover/timeline:h-2 transition-all">
              <div className="h-full bg-[#e50914] relative" style={{ width: `${progressPercent}%` }} />
            </div>

            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#e50914] shadow-md border border-white scale-0 group-hover/timeline:scale-100 transition-transform pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />

            {hoverSeekSeconds !== null && (
              <div
                className="absolute -top-8 px-2 py-1 rounded bg-[#14141a] text-[11px] font-mono text-white border border-white/20 pointer-events-none transform -translate-x-1/2 shadow-lg"
                style={{ left: `${(hoverSeekSeconds / totalSeconds) * 100}%` }}
              >
                {formatPlayerTime(hoverSeekSeconds)}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 text-white hover:text-[#e50914] transition-colors cursor-pointer"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6 sm:w-7 sm:h-7" /> : <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />}
              </button>

              <button
                onClick={() => seekBy(-10)}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Rewind 10 seconds"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => seekBy(10)}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Forward 10 seconds"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-14 sm:w-24 accent-[#e50914] h-1 bg-white/20 rounded cursor-pointer"
                  aria-label="Volume slider"
                />
              </div>

              {/* Timestamp */}
              <div className="text-xs sm:text-sm font-mono text-neutral-300 tabular-nums">
                <span>{formatPlayerTime(currentSeconds)}</span>
                <span className="text-neutral-500 mx-1">/</span>
                <span className="text-neutral-400">{formatPlayerTime(totalSeconds)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 relative">
              {/* Subtitles */}
              <button
                onClick={() => setShowSubtitlesMenu(!showSubtitlesMenu)}
                className={`p-1.5 transition-colors cursor-pointer ${
                  selectedSubtitle !== 'Off' ? 'text-[#e50914]' : 'text-neutral-300 hover:text-white'
                }`}
                aria-label="Subtitles"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
