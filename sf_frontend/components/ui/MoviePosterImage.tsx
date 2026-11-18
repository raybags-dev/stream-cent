import React, { useState, useEffect } from 'react';
import { Film } from 'lucide-react';
import { DEFAULT_POSTER_IMAGE } from '../../lib/api/mockData';

interface MoviePosterImageProps {
  src?: string | null;
  alt: string; // Movie title as required by user prompt
  aspect?: 'poster' | 'backdrop' | 'banner' | 'landscape' | 'square' | 'auto';
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  releaseYear?: number;
  genres?: string[];
  objectFit?: 'cover' | 'contain' | 'fill';
}

export const MoviePosterImage: React.FC<MoviePosterImageProps> = ({
  src,
  alt,
  aspect = 'poster',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  releaseYear,
  genres = [],
  objectFit = 'cover',
}) => {
  const [hasError, setHasError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setHasError(false);
    setFallbackFailed(false);
  }, [src]);

  const isValidUrl = Boolean(
    src &&
      typeof src === 'string' &&
      src.trim() !== '' &&
      src !== 'null' &&
      src !== 'undefined' &&
      !src.includes('undefined')
  );

  // Missing or broken artwork: show the bundled cinematic poster instead of a
  // blank/dark card so first-time visitors never see a broken layout.
  if ((!isValidUrl || hasError) && !fallbackFailed) {
    return (
      <img
        src={DEFAULT_POSTER_IMAGE}
        alt={alt}
        loading={loading}
        onError={() => setFallbackFailed(true)}
        className={`w-full h-full object-${objectFit} ${imgClassName} ${className}`}
      />
    );
  }

  if ((!isValidUrl || hasError) && fallbackFailed) {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-3.5 bg-gradient-to-b from-[#1c1c24] via-[#121218] to-[#0a0a0e] text-white select-none overflow-hidden border border-white/10 ${className}`}
        role="img"
        aria-label={`${alt} - No Poster Available`}
      >
        {/* Filmstrip Sprockets Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 flex justify-between px-1 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-black/80 my-auto rounded-[0.5px]" />
          ))}
        </div>

        {/* Top Header Label */}
        <div className="pt-2 flex items-center justify-between z-10">
          <span className="text-[9px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">
            STREAM FLIX
          </span>
          <span className="text-[8px] font-bold text-white bg-[#e50914]/80 px-1.5 py-0.5 rounded">
            ARCHIVE
          </span>
        </div>

        {/* Center Graphic Emblem */}
        <div className="flex flex-col items-center justify-center my-auto py-2 text-center z-10">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/15 flex items-center justify-center mb-2 shadow-inner text-neutral-400">
            <Film className="w-5 h-5 sm:w-6 sm:h-6 text-[#e50914]" />
          </div>
          <div className="border border-dashed border-white/30 px-2 py-0.5 rounded bg-black/50">
            <span className="text-[10px] font-black tracking-widest uppercase text-neutral-300">
              NO POSTER
            </span>
          </div>
          <p className="text-[8px] text-neutral-500 font-mono mt-1">OFFICIAL ARTWORK PENDING</p>
        </div>

        {/* Bottom Movie Title as Alt Text Display */}
        <div className="pb-1 border-t border-white/10 pt-2 z-10">
          <p
            className="font-bold text-xs leading-tight text-white line-clamp-2"
            title={alt}
          >
            {alt}
          </p>
          {(releaseYear || genres.length > 0) && (
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-1">
              {releaseYear && <span>{releaseYear}</span>}
              {releaseYear && genres.length > 0 && <span>·</span>}
              {genres[0] && <span>{genres[0]}</span>}
            </div>
          )}
        </div>

        {/* Filmstrip Sprockets Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 flex justify-between px-1 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1 bg-black/80 my-auto rounded-[0.5px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`w-full h-full ${objectFit ? `object-${objectFit}` : 'object-cover'} ${imgClassName} ${className}`}
    />
  );
};
