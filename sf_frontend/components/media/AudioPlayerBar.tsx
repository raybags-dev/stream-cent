import React, { useState, useEffect, useRef } from 'react';
import { PodcastEpisode } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Headphones,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioPlayerBarProps {
  episode: PodcastEpisode | null;
  onClose: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({ episode, onClose }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode?.durationSeconds || 1800);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // When episode changes, load and play
  useEffect(() => {
    if (episode && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setDuration(episode.durationSeconds || 1800);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [episode]);

  if (!episode) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const skipSeconds = (sec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx] ?? 1;
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Podcast Audio Player"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#121218]/98 backdrop-blur-2xl border-t border-white/15 px-3 sm:px-6 py-2.5 sm:py-3 shadow-2xl text-white selection:bg-[#e50914]"
      >
        <audio
          ref={audioRef}
          src={episode.audioUrl}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current && audioRef.current.duration) {
              setDuration(audioRef.current.duration);
            }
          }}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          {/* Left: Episode Info */}
          <div className="flex items-center gap-3 w-full sm:w-1/4 min-w-0 justify-between sm:justify-start">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={episode.coverUrl}
                alt={episode.title}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover shrink-0 border border-white/20 shadow-md"
              />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                  {episode.title}
                </p>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {episode.showName} · {episode.hostName}
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="sm:hidden p-1 text-neutral-400 hover:text-white rounded-full cursor-pointer"
              aria-label="Close audio player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Controls & Scrubber */}
          <div className="flex-1 max-w-2xl w-full flex flex-col items-center gap-1.5">
            {/* Playback Buttons */}
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => skipSeconds(-15)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Rewind 15 seconds"
                aria-label="Rewind 15 seconds"
              >
                <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                aria-label={isPlaying ? 'Pause podcast' : 'Play podcast'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => skipSeconds(15)}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Forward 15 seconds"
                aria-label="Forward 15 seconds"
              >
                <RotateCw className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              <button
                onClick={cycleSpeed}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Scrubber Bar */}
            <div className="w-full flex items-center gap-2.5 text-[10px] sm:text-xs text-neutral-400 font-mono">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#e50914]"
              />
              <span className="w-10 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Volume & Dismiss (Desktop) */}
          <div className="hidden sm:flex items-center justify-end gap-3 w-1/4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close player"
              aria-label="Close player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
