import { cacheManager } from "../cache/cache";
import { CastMember, QualityBadge, Title } from "../types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";
const TMDB_IMAGE_POSTER = "https://image.tmdb.org/t/p/w780";
const TMDB_IMAGE_PROFILE = "https://image.tmdb.org/t/p/w185";

const RELIABLE_STREAM_URLS = [
  "https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4",
  "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4",
  "https://media.w3.org/2010/05/sintel/trailer.mp4",
  "https://media.w3.org/2010/05/bunny/trailer.mp4",
  "https://media.w3.org/2010/05/video/movie_300.mp4",
  "https://vjs.zencdn.net/v/oceans.mp4",
];

const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

export class TmdbService {
  private get apiKey(): string {
    return process.env.TMDB_API_KEY || "";
  }

  private get apiToken(): string {
    return process.env.TMDB_API_TOKEN || "";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey || this.apiToken);
  }

  private getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.apiToken) {
      headers["Authorization"] = `Bearer ${this.apiToken}`;
    }
    return headers;
  }

  private buildUrl(
    endpointPath: string,
    params: Record<string, string> = {},
  ): string {
    const url = new URL(`${TMDB_BASE_URL}${endpointPath}`);
    if (this.apiKey && !this.apiToken) {
      url.searchParams.set("api_key", this.apiKey);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  }

  async fetchFromTmdb<T>(
    endpointPath: string,
    params: Record<string, string> = {},
    ttlSeconds = 7200,
  ): Promise<T | null> {
    if (!this.isConfigured()) return null;

    const paramKey = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const cacheKey = `tmdb:${endpointPath}:${paramKey}`;

    const cached = cacheManager.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = this.buildUrl(endpointPath, params);
      const res = await fetch(url, { headers: this.getAuthHeaders() });
      if (!res.ok) {
        console.warn(
          `[TMDB API] Request to ${endpointPath} failed with status: ${res.status}`,
        );
        return null;
      }
      const data = (await res.json()) as T;
      cacheManager.set(cacheKey, data, ttlSeconds);
      return data;
    } catch (err) {
      console.error(`[TMDB API] Error requesting ${endpointPath}:`, err);
      return null;
    }
  }

  async getTrending(timeWindow: "day" | "week" = "week"): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      `/trending/all/${timeWindow}`,
      {},
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && (item.title || item.name))
      .map((item, index) => this.mapTmdbItemToTitle(item, index + 1));
  }

  async getPopularMovies(): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/movie/popular",
      {},
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && item.title)
      .map((item, index) => this.mapTmdbItemToTitle(item, index + 1));
  }

  async getTopRatedMovies(): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/movie/top_rated",
      {},
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && item.title)
      .map((item, index) => this.mapTmdbItemToTitle(item, index + 1));
  }

  async getPopularSeries(): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/tv/popular",
      {},
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && item.name)
      .map((item, index) =>
        this.mapTmdbItemToTitle({ ...item, media_type: "tv" }, index + 1),
      );
  }

  async getHorrorMovies(): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/discover/movie",
      { with_genres: "27", sort_by: "popularity.desc", include_adult: "false" },
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && item.title)
      .map((item, index) => this.mapTmdbItemToTitle(item, index + 1));
  }

  async getRomanticComedyMovies(): Promise<Title[]> {
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/discover/movie",
      {
        with_genres: "35,10749",
        sort_by: "popularity.desc",
        include_adult: "false",
      },
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter((item) => item.poster_path && item.title)
      .map((item, index) => this.mapTmdbItemToTitle(item, index + 1));
  }

  async getMovieDetails(tmdbId: string | number): Promise<Title | null> {
    const data = await this.fetchFromTmdb<any>(
      `/movie/${tmdbId}`,
      { append_to_response: "videos,credits,similar,release_dates" },
      86400,
    );
    if (!data?.poster_path) return null;
    return this.mapTmdbItemToTitle(data, undefined, true);
  }

  async getSeriesDetails(tmdbId: string | number): Promise<Title | null> {
    const data = await this.fetchFromTmdb<any>(
      `/tv/${tmdbId}`,
      { append_to_response: "videos,credits,similar,content_ratings" },
      86400,
    );
    if (!data?.poster_path) return null;
    return this.mapTmdbItemToTitle(
      { ...data, media_type: "tv" },
      undefined,
      true,
    );
  }

  async search(query: string, year?: number): Promise<Title[]> {
    const params: Record<string, string> = {
      query,
      include_adult: "false",
    };
    if (year) {
      params.primary_release_year = String(year);
      params.first_air_date_year = String(year);
    }
    const data = await this.fetchFromTmdb<{ results: any[] }>(
      "/search/multi",
      params,
      86400,
    );
    if (!data?.results?.length) return [];
    return data.results
      .filter(
        (item) =>
          (item.media_type === "movie" || item.media_type === "tv") &&
          item.poster_path,
      )
      .map((item) => this.mapTmdbItemToTitle(item));
  }

  private getGenres(raw: any, isTv: boolean): string[] {
    let genres: string[] = [];
    if (Array.isArray(raw.genres) && raw.genres.length > 0) {
      genres = raw.genres.map((g: any) => g.name);
    } else if (Array.isArray(raw.genre_ids)) {
      genres = raw.genre_ids
        .map((gid: number) => TMDB_GENRE_MAP[gid])
        .filter(Boolean);
    }

    if (
      genres.includes("Comedy") &&
      genres.includes("Romance") &&
      !genres.includes("Romantic Comedy")
    ) {
      genres.push("Romantic Comedy");
    }
    if (raw.genre_ids?.includes(27) && !genres.includes("Horror")) {
      genres.push("Horror");
    }

    return genres.length ? genres : [isTv ? "Drama Series" : "Sci-Fi Action"];
  }

  private getBackdropUrl(raw: any): string {
    if (raw.backdrop_path) {
      return `${TMDB_IMAGE_ORIGINAL}${raw.backdrop_path}`;
    }
    if (raw.poster_path) {
      return `${TMDB_IMAGE_ORIGINAL}${raw.poster_path}`;
    }
    return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920";
  }

  private getTrailerVideoUrl(raw: any, videoStreamUrl: string): string {
    const videos = raw.videos?.results;
    if (!videos?.length) return videoStreamUrl;

    const trailer =
      videos.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
      videos.find((v: any) => v.site === "YouTube") ||
      videos[0];
    return trailer?.key
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : videoStreamUrl;
  }

  private mapCast(raw: any): CastMember[] {
    return (raw.credits?.cast || []).slice(0, 10).map((c: any) => ({
      id: `tmdb-cast-${c.id}`,
      name: c.name,
      character: c.character || "Leading Cast",
      role: "Actor",
      profileUrl: c.profile_path
        ? `${TMDB_IMAGE_PROFILE}${c.profile_path}`
        : undefined,
    }));
  }

  private getFallbackCast(id: string): CastMember[] {
    return [
      {
        id: `c-${id}-1`,
        name: "Bryan Cranston",
        character: "Principal Lead",
        role: "Lead",
        profileUrl:
          "https://static.tvmaze.com/uploads/images/medium_portrait/195/488839.jpg",
      },
      {
        id: `c-${id}-2`,
        name: "Aaron Paul",
        character: "Co-Lead",
        role: "Lead",
        profileUrl:
          "https://static.tvmaze.com/uploads/images/medium_portrait/195/488841.jpg",
      },
      {
        id: `c-${id}-3`,
        name: "Anna Gunn",
        character: "Key Ensemble",
        role: "Supporting",
        profileUrl:
          "https://static.tvmaze.com/uploads/images/medium_portrait/195/488842.jpg",
      },
      {
        id: `c-${id}-4`,
        name: "Giancarlo Esposito",
        character: "Antagonist",
        role: "Supporting",
        profileUrl:
          "https://static.tvmaze.com/uploads/images/medium_portrait/195/488843.jpg",
      },
    ];
  }

  private getDirectors(raw: any): string[] {
    const directors: string[] = (raw.credits?.crew || [])
      .filter((c: any) => c.job === "Director")
      .slice(0, 3)
      .map((d: any) => d.name);
    if (Array.isArray(raw.created_by)) {
      directors.push(...raw.created_by.map((creator: any) => creator.name));
    }
    return directors;
  }

  private isOriginal(raw: any, isDetailed: boolean): boolean {
    return isDetailed
      ? Boolean(
          raw.production_companies?.some((c: any) =>
            c.name?.toLowerCase().includes("netflix"),
          ),
        )
      : false;
  }

  mapTmdbItemToTitle(raw: any, rank?: number, isDetailed = false): Title {
    const isTv =
      raw.media_type === "tv" ||
      Boolean(raw.first_air_date) ||
      Boolean(raw.name);
    const id = `tmdb-${isTv ? "tv" : "movie"}-${raw.id}`;
    const title = raw.title || raw.name || "Untitled Title";
    const originalTitle = raw.original_title || raw.original_name;

    const releaseDate = raw.release_date || raw.first_air_date || "";
    const releaseYear = releaseDate
      ? parseInt(releaseDate.slice(0, 4), 10)
      : new Date().getFullYear();

    const voteAverage =
      typeof raw.vote_average === "number" ? raw.vote_average : 8.5;
    const matchScore = Math.min(99, Math.max(82, Math.round(voteAverage * 10)));

    const genres = this.getGenres(raw, isTv);
    const backdropUrl = this.getBackdropUrl(raw);

    const posterUrl = raw.poster_path
      ? `${TMDB_IMAGE_POSTER}${raw.poster_path}`
      : backdropUrl;

    const streamSeed = Math.abs(
      id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0),
    );
    const videoStreamUrl =
      RELIABLE_STREAM_URLS[streamSeed % RELIABLE_STREAM_URLS.length];

    const trailerVideoUrl = this.getTrailerVideoUrl(raw, videoStreamUrl);
    const cast = this.mapCast(raw);
    const directors = this.getDirectors(raw);

    const qualities: QualityBadge[] = [
      "4K Ultra HD",
      "Dolby Vision",
      "Spatial Audio",
    ];

    return {
      id,
      title,
      originalTitle: originalTitle !== title ? originalTitle : undefined,
      type: isTv ? "series" : "movie",
      tagline:
        raw.tagline ||
        (isTv
          ? "A Stream Flix Premier Series"
          : "Now Streaming in 4K Ultra HD"),
      synopsis:
        raw.overview ||
        "An epic cinematic journey available in spatial audio and Dolby Vision.",
      releaseYear,
      maturityRating: raw.adult ? "R" : voteAverage > 7.5 ? "TV-MA" : "PG-13",
      matchScore,
      durationMinutes: isTv ? undefined : raw.runtime || 118,
      totalSeasons: isTv ? raw.number_of_seasons || 1 : undefined,
      genres,
      backdropUrl,
      posterUrl,
      trailerVideoUrl,
      videoStreamUrl,
      isTrending: rank !== undefined ? rank <= 5 : Boolean(raw.popularity > 50),
      isTop10: rank !== undefined && rank <= 10,
      top10Rank: rank && rank <= 10 ? rank : undefined,
      isNewRelease: releaseYear >= 2025,
      isOriginal: this.isOriginal(raw, isDetailed),
      qualities,
      cast: cast.length >= 2 ? cast : this.getFallbackCast(id),
      trailerUrl: trailerVideoUrl,
      directors: directors.length ? directors : ["Studio Production"],
      audioLanguages: ["English (Original)", "Spanish", "French", "German"],
      subtitleLanguages: [
        "English [CC]",
        "Spanish",
        "French",
        "German",
        "Dutch",
      ],
    };
  }
}

export const tmdbService = new TmdbService();
