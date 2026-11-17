import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const heights = {
    sm: 26,
    md: 34,
    lg: 44,
  };

  const currentHeight = heights[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none focus:outline-none ${className}`}
      aria-label="Stream Flix Home"
    >
      {/* Iconic 3D Ribbon 'S' Glyph with Cinematic Film Curves */}
      <svg
        height={currentHeight}
        viewBox="0 0 38 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="sf_red_primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF1E27" />
            <stop offset="60%" stopColor="#E50914" />
            <stop offset="100%" stopColor="#990008" />
          </linearGradient>
          <linearGradient id="sf_red_dark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B80710" />
            <stop offset="100%" stopColor="#550005" />
          </linearGradient>
          <linearGradient id="sf_flare" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <filter id="sf_shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>

        {/* Back Ribbon Fold of the 'S' */}
        <path
          d="M26 6C18 6 10 9 10 16C10 21 16 23.5 24 25.5C31 27.2 34 30.5 34 34.5C34 40 26 42 18 42C11 42 4 39 3 36L7 28C9 30 14 32.5 19 32.5C23.5 32.5 26.5 31 26.5 28.5C26.5 25.5 22 23.5 14 21C6 18.5 2 14.5 2 9C2 3.5 9 0 20 0C26 0 31.5 2 34 4L29.5 12C28 10 24.5 8 21 8"
          fill="url(#sf_red_dark)"
        />

        {/* Dynamic Forward Arc Ribbon */}
        <path
          d="M20 0C27 0 33 2.5 35 4.5L30.5 12.5C28.5 10.5 25 8.5 20.5 8.5C13.5 8.5 8.5 11 8.5 15C8.5 18.5 12.5 20.5 19.5 22.8C28 25.5 34 29 34 35C34 41.5 25 42 18 42C11 42 4 39 2 36L6.5 28C8.5 30.5 13.5 33 18.5 33C24 33 27 31 27 28C27 24.5 22.5 22.5 15.5 20.2C7.5 17.5 2 14 2 8C2 2 10.5 0 20 0Z"
          fill="url(#sf_red_primary)"
          filter="url(#sf_shadow)"
        />

        {/* Subtle Anamorphic Highlight */}
        <path
          d="M21 1C27 1 31.5 2.8 33 4.2L30 9.5C28.5 8 25.5 6.5 21 6.5C15 6.5 10 8.5 9.5 12L7.5 11C8.5 5 15 1 21 1Z"
          fill="url(#sf_flare)"
        />
      </svg>

      {/* Styled Wordmark: STREAM FLIX */}
      {showText && (
        <div className="flex items-baseline tracking-tighter leading-none">
          <span className="font-extrabold text-white uppercase text-lg sm:text-xl tracking-wider">
            STREAM
          </span>
          <span className="font-black text-[#e50914] uppercase text-lg sm:text-xl tracking-tight ml-0.5">
            FLIX
          </span>
        </div>
      )}
    </div>
  );
};
