import React from 'react';

export const CardSkeleton: React.FC<{ aspect?: 'poster' | 'backdrop' }> = ({
  aspect = 'poster',
}) => {
  return (
    <div
      className={`rounded-md bg-neutral-800/60 animate-pulse border border-white/5 ${
        aspect === 'poster' ? 'aspect-[2/3] w-full min-w-[140px] sm:min-w-[170px]' : 'aspect-video w-full min-w-[240px]'
      }`}
    />
  );
};

export const RowSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 px-4 sm:px-8 md:px-12 my-6">
      <div className="h-5 w-48 bg-neutral-800/80 rounded animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] w-[140px] sm:w-[170px] md:w-[200px] shrink-0 rounded-md bg-neutral-800/50 animate-pulse border border-white/5"
          />
        ))}
      </div>
    </div>
  );
};

export const BillboardSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[65vh] sm:h-[80vh] bg-neutral-900 animate-pulse overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-transparent to-transparent z-10" />
      <div className="absolute bottom-12 left-4 sm:left-12 max-w-xl space-y-4 z-20">
        <div className="h-6 w-32 bg-neutral-800/80 rounded" />
        <div className="h-12 w-80 bg-neutral-800 rounded" />
        <div className="h-16 w-full bg-neutral-800/60 rounded" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-32 bg-neutral-700 rounded-md" />
          <div className="h-11 w-36 bg-neutral-800 rounded-md" />
        </div>
      </div>
    </div>
  );
};
