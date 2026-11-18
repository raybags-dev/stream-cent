// Remembers that the next navigation to a browse route should land on the
// content rows instead of the top-of-page hero. Set by the navbar, consumed by
// navigate() (to skip scroll-to-top) and resolved by scrollToBrowseContent().
let pendingBrowseContentScroll = false;

const CONTENT_ROUTES = new Set(['/browse', '/browse/series', '/browse/movies', '/browse/new']);
const MAX_SCROLL_ATTEMPTS = 20;

export const isBrowseContentPath = (path: string): boolean => CONTENT_ROUTES.has(path);

export const requestBrowseContentScroll = (path: string): void => {
  pendingBrowseContentScroll = isBrowseContentPath(path);
};

export const peekBrowseContentScroll = (): boolean => pendingBrowseContentScroll;

export const clearBrowseContentScroll = (): void => {
  pendingBrowseContentScroll = false;
};

// Scrolls the rendered content rows into view, retrying briefly while the
// route mounts. Works for both cross-page and same-page navbar clicks.
export const scrollToBrowseContent = (attempt = 0): void => {
  if (typeof window === 'undefined') return;
  const target = document.getElementById('browse-content');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearBrowseContentScroll();
    return;
  }
  if (attempt < MAX_SCROLL_ATTEMPTS) {
    window.setTimeout(() => scrollToBrowseContent(attempt + 1), 50);
  }
};
