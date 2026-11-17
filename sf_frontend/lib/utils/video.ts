export const VERIFIED_FALLBACK_VIDEOS = [
  'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
  'https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://vjs.zencdn.net/v/oceans.mp4',
];

export function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export function isDeadVideoUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  return (
    url.includes('commondatastorage.googleapis.com/gtv-videos-bucket') ||
    url.includes('storage.googleapis.com/gtv-videos-bucket')
  );
}

export function isDirectVideoUrl(url?: string): boolean {
  if (!url || isDeadVideoUrl(url)) return false;
  return (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.m3u8') ||
    url.includes('.mp4?') ||
    url.startsWith('data:video/') ||
    url.startsWith('blob:')
  );
}

export function resolvePlayableDirectVideo(
  preferredUrl?: string,
  secondaryUrl?: string,
  seedKey = ''
): string {
  if (preferredUrl && !isDeadVideoUrl(preferredUrl) && !extractYoutubeId(preferredUrl)) {
    return preferredUrl;
  }
  if (secondaryUrl && !isDeadVideoUrl(secondaryUrl) && !extractYoutubeId(secondaryUrl)) {
    return secondaryUrl;
  }
  const seed = Math.abs(
    seedKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  );
  return VERIFIED_FALLBACK_VIDEOS[seed % VERIFIED_FALLBACK_VIDEOS.length]!;
}

export function getNextFallbackVideo(currentUrl?: string): string | null {
  if (!currentUrl) return VERIFIED_FALLBACK_VIDEOS[0]!;
  const idx = VERIFIED_FALLBACK_VIDEOS.indexOf(currentUrl);
  if (idx === -1) return VERIFIED_FALLBACK_VIDEOS[0]!;
  if (idx + 1 < VERIFIED_FALLBACK_VIDEOS.length) {
    return VERIFIED_FALLBACK_VIDEOS[idx + 1]!;
  }
  return null;
}
