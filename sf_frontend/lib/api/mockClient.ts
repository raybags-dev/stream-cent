import { Plan, Profile, Title, PodcastEpisode } from '../../types';
import { MOCK_DEFAULT_PROFILES, MOCK_PLANS, MOCK_TITLES, MOCK_PODCASTS } from './mockData';
import { extractYoutubeId, resolvePlayableDirectVideo } from '../utils/video';

export interface TitlesQueryOptions {
  type?: 'movie' | 'series';
  genre?: string;
  search?: string;
  year?: number | string;
  isTrending?: boolean;
  isTop10?: boolean;
  isNewRelease?: boolean;
  profileKidsLimit?: boolean;
  sortBy?: 'popularity' | 'year' | 'match' | 'title';
  limit?: number;
}

function sanitizeTitleMedia(title: Title): Title {
  const candidateTrailer = title.trailerVideoUrl || title.trailerUrl;
  const ytId = extractYoutubeId(candidateTrailer);
  const resolvedDirectStream = resolvePlayableDirectVideo(
    title.videoStreamUrl,
    ytId ? undefined : candidateTrailer,
    title.id
  );
  const resolvedTrailer = ytId ? candidateTrailer! : resolvedDirectStream;

  return {
    ...title,
    trailerVideoUrl: resolvedTrailer,
    trailerUrl: resolvedTrailer,
    videoStreamUrl: resolvedDirectStream,
  };
}

class StreamFlixApiClient {
  private titles: Title[] = MOCK_TITLES.map(sanitizeTitleMedia);
  private plans: Plan[] = [...MOCK_PLANS];
  private hydratedTitlesCache: Map<string, Title> = new Map();

  // Helper for API calls with fallback. Times out fast so pages can fall back
  // to bundled default content instead of waiting on a slow API.
  private async fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
    try {
      const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const res = await fetch(`${apiBase}${endpoint}`, {
        credentials: 'include',
        signal: options.signal ?? AbortSignal.timeout(3500),
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as T;
    } catch {
      return null;
    }
  }

  // Fetch all titles with optional filtering
  async getTitles(options?: TitlesQueryOptions): Promise<Title[]> {
    const params = new URLSearchParams();
    if (options?.type) params.set('type', options.type);
    if (options?.genre) params.set('genre', options.genre);
    if (options?.search) params.set('search', options.search);
    if (options?.year) params.set('year', String(options.year));
    if (options?.isTrending) params.set('isTrending', 'true');
    if (options?.isTop10) params.set('isTop10', 'true');
    if (options?.isNewRelease) params.set('isNewRelease', 'true');
    if (options?.profileKidsLimit) params.set('profileKidsLimit', 'true');
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.limit) params.set('limit', String(options.limit));

    const serverData = await this.fetchApi<Title[]>(`/api/titles?${params.toString()}`);
    if (serverData && serverData.length > 0) {
      return serverData
        .filter((t) => t.posterUrl && t.posterUrl.trim() !== '' && !t.posterUrl.includes('undefined'))
        .map(sanitizeTitleMedia);
    }

    // Client-side fallback
    return this.filterLocalTitles(options);
  }

  // Synchronous bundled catalog for instant first paint (no network wait).
  getInitialTitles(options?: TitlesQueryOptions): Title[] {
    return this.filterLocalTitles(options);
  }

  getInitialBillboard(): Title {
    return sanitizeTitleMedia(this.titles[0]!);
  }

  private filterLocalTitles(options?: TitlesQueryOptions): Title[] {
    let results = this.titles.filter(
      (t) => t.posterUrl && t.posterUrl.trim() !== '' && !t.posterUrl.includes('undefined')
    );
    if (options?.profileKidsLimit) {
      results = results.filter((t) => t.maturityRating === 'G' || t.maturityRating === 'PG');
    }
    if (options?.type) {
      results = results.filter((t) => t.type === options.type);
    }
    if (options?.genre && options.genre !== 'all') {
      const g = options.genre.toLowerCase();
      results = results.filter((t) =>
        t.genres.some((item) => item.toLowerCase() === g || item.toLowerCase().includes(g))
      );
    }
    if (options?.year) {
      const y = typeof options.year === 'string' ? parseInt(options.year, 10) : options.year;
      if (!isNaN(y)) {
        results = results.filter((t) => t.releaseYear === y);
      }
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.synopsis.toLowerCase().includes(q) ||
          t.genres.some((g) => g.toLowerCase().includes(q)) ||
          t.cast.some((c) => c.name.toLowerCase().includes(q)) ||
          t.directors.some((d) => d.toLowerCase().includes(q))
      );
    }
    if (options?.isTrending) {
      results = results.filter((t) => t.isTrending);
    }
    if (options?.isTop10) {
      results = results.filter((t) => t.isTop10).sort((a, b) => (a.top10Rank ?? 99) - (b.top10Rank ?? 99));
    }
    if (options?.isNewRelease) {
      results = results.filter((t) => t.isNewRelease);
    }
    if (options?.sortBy) {
      if (options.sortBy === 'popularity' || options.sortBy === 'match') {
        results.sort((a, b) => b.matchScore - a.matchScore);
      } else if (options.sortBy === 'year') {
        results.sort((a, b) => b.releaseYear - a.releaseYear);
      } else if (options.sortBy === 'title') {
        results.sort((a, b) => a.title.localeCompare(b.title));
      }
    }
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }
    return results.map(sanitizeTitleMedia);
  }

  // Fetch title by ID (cached once enriched with YouTube trailer / cast)
  async getTitleById(id: string): Promise<Title | null> {
    const cached = this.hydratedTitlesCache.get(id);
    if (cached && cached.trailerVideoUrl?.includes('youtu') && cached.cast.length > 2) {
      return cached;
    }

    const serverData = await this.fetchApi<Title>(`/api/titles/${encodeURIComponent(id)}`);
    if (serverData) {
      const clean = sanitizeTitleMedia(serverData);
      this.hydratedTitlesCache.set(id, clean);
      return clean;
    }

    const found = this.titles.find((t) => t.id === id);
    return found ? sanitizeTitleMedia(found) : null;
  }

  // Fetch "More Like This" recommendations
  async getMoreLikeThis(id: string, limit = 6): Promise<Title[]> {
    const serverData = await this.fetchApi<Title[]>(`/api/titles/${encodeURIComponent(id)}/related?limit=${limit}`);
    if (serverData && serverData.length > 0) return serverData.map(sanitizeTitleMedia);

    const target = this.titles.find((t) => t.id === id);
    if (!target) return this.titles.slice(0, limit).map(sanitizeTitleMedia);

    return this.titles
      .filter((t) => t.id !== id)
      .map((t) => {
        let score = 0;
        const sharedGenres = t.genres.filter((g) => target.genres.includes(g)).length;
        score += sharedGenres * 3;
        if (t.type === target.type) score += 2;
        if (t.maturityRating === target.maturityRating) score += 1;
        return { title: t, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => sanitizeTitleMedia(item.title))
      .slice(0, limit);
  }

  // Get subscription plans
  async getPlans(): Promise<Plan[]> {
    const serverData = await this.fetchApi<Plan[]>('/api/billing/plans');
    if (serverData && serverData.length > 0) return serverData;
    return [...this.plans];
  }

  // Get default profiles
  async getDefaultProfiles(): Promise<Profile[]> {
    return [...MOCK_DEFAULT_PROFILES];
  }

  // Featured billboard title
  async getFeaturedBillboard(): Promise<Title> {
    const serverData = await this.fetchApi<Title>('/api/titles/billboard');
    if (serverData) return sanitizeTitleMedia(serverData);
    return sanitizeTitleMedia(this.titles[0]!);
  }

  // Creator Studio: Upload custom user movie / video with thumbnail
  async uploadMovie(movie: Omit<Title, 'id' | 'matchScore'> & { id?: string; matchScore?: number }): Promise<Title> {
    const serverData = await this.fetchApi<Title>('/api/titles/upload', {
      method: 'POST',
      body: JSON.stringify(movie),
    });
    if (serverData) {
      const clean = sanitizeTitleMedia(serverData);
      this.titles.unshift(clean);
      return clean;
    }

    const newTitle: Title = {
      ...movie,
      id: movie.id || `custom-movie-${Date.now()}`,
      matchScore: movie.matchScore || Math.floor(Math.random() * 6) + 94,
      userUploaded: true,
      qualities: movie.qualities?.length ? movie.qualities : ['4K Ultra HD', 'Spatial Audio'],
      cast: movie.cast?.length ? movie.cast : [{ id: 'user-creator', name: 'Community Creator', character: 'Producer', role: 'Lead' }],
      directors: movie.directors?.length ? movie.directors : ['Independent Creator'],
      audioLanguages: movie.audioLanguages?.length ? movie.audioLanguages : ['English (Original)'],
      subtitleLanguages: movie.subtitleLanguages?.length ? movie.subtitleLanguages : ['English [CC]'],
    };

    this.titles.unshift(newTitle);
    return newTitle;
  }

  // Podcast Center: Get all podcast episodes
  async getPodcasts(category?: string): Promise<PodcastEpisode[]> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const serverData = await this.fetchApi<PodcastEpisode[]>(`/api/podcasts${params}`);
    if (serverData && serverData.length > 0) return serverData;

    let list: PodcastEpisode[] = [...MOCK_PODCASTS];
    if (category && category !== 'all') {
      const c = category.toLowerCase();
      list = list.filter((p) => p.category.toLowerCase().includes(c));
    }
    return list;
  }

  // Podcast Center: Upload new podcast episode (MP3 audio + cover art)
  async uploadPodcast(episode: Omit<PodcastEpisode, 'id' | 'publishDate'> & { id?: string; publishDate?: string }): Promise<PodcastEpisode> {
    const serverData = await this.fetchApi<PodcastEpisode>('/api/podcasts/upload', {
      method: 'POST',
      body: JSON.stringify(episode),
    });
    if (serverData) return serverData;

    const newEpisode: PodcastEpisode = {
      ...episode,
      id: episode.id || `podcast-${Date.now()}`,
      publishDate: episode.publishDate || 'Just now',
      playsCount: Math.floor(Math.random() * 200) + 12,
    };
    return newEpisode;
  }

  // Streaming Availability
  async getAvailability(titleId: string): Promise<any> {
    return this.fetchApi(`/api/availability/${encodeURIComponent(titleId)}`);
  }

  // Admin Controller API methods
  async getAdminStatus(): Promise<any> {
    return this.fetchApi('/api/admin/status');
  }

  async toggleLiveMovies(enabled?: boolean): Promise<any> {
    this.hydratedTitlesCache.clear();
    return this.fetchApi('/api/admin/toggle-live-movies', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async syncCatalog(): Promise<any> {
    this.hydratedTitlesCache.clear();
    return this.fetchApi('/api/admin/sync-catalog', {
      method: 'POST',
    });
  }
}

export const streamFlixApi = new StreamFlixApiClient();
