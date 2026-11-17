import { Title, CastMember, Episode } from '../types';

const TVMAZE_BASE_URL = process.env.TVMAZE_BASE_URL || 'https://api.tvmaze.com';

export class TvmazeService {
  async fetchFromTvmaze<T>(endpointPath: string): Promise<T | null> {
    try {
      const res = await fetch(`${TVMAZE_BASE_URL}${endpointPath}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[TVMaze API] Error requesting ${endpointPath}:`, err);
      return null;
    }
  }

  async getPopularShows(page = 0, limit = 20): Promise<Title[]> {
    const data = await this.fetchFromTvmaze<any[]>(`/shows?page=${page}`);
    if (!Array.isArray(data)) return [];

    const candidates = data.filter((show) => show.image?.original && show.summary).slice(0, limit);
    const detailed = await Promise.all(
      candidates.map(async (show, index) => {
        const full = await this.getShowDetails(show.id);
        return full || this.mapTvmazeShowToTitle(show, index + 1);
      })
    );

    return detailed;
  }

  async searchShows(query: string): Promise<Title[]> {
    const data = await this.fetchFromTvmaze<any[]>(`/search/shows?q=${encodeURIComponent(query)}`);
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item.show?.image?.original)
      .map((item) => this.mapTvmazeShowToTitle(item.show));
  }

  async getShowDetails(id: string | number): Promise<Title | null> {
    const data = await this.fetchFromTvmaze<any>(`/shows/${id}?embed[]=episodes&embed[]=cast`);
    if (!data) return null;
    return this.mapTvmazeShowToTitle(data);
  }

  mapTvmazeShowToTitle(show: any, rank?: number): Title {
    const id = `tvmaze-series-${show.id}`;
    const cleanSummary = (show.summary || '').replace(/<[^>]*>?/gm, '');

    const releaseYear = show.premiered ? parseInt(show.premiered.slice(0, 4), 10) : 2024;
    const ratingScore = show.rating?.average ? Math.round(show.rating.average * 10) : 92;

    const episodes: Episode[] = (show._embedded?.episodes || []).slice(0, 12).map((ep: any) => ({
      id: `ep-${ep.id}`,
      seasonNumber: ep.season || 1,
      episodeNumber: ep.number || 1,
      title: ep.name || `Episode ${ep.number}`,
      synopsis: (ep.summary || '').replace(/<[^>]*>?/gm, '') || 'Episode overview and storyline.',
      duration: ep.runtime || 50,
      thumbnail: ep.image?.original || ep.image?.medium || show.image?.original,
    }));

    const cast: CastMember[] = (show._embedded?.cast || []).slice(0, 12).map((c: any) => ({
      id: `tvmaze-cast-${c.person.id}`,
      name: c.person.name,
      character: c.character.name || 'Cast Member',
      role: 'Actor',
      profileUrl: c.person.image?.medium || c.person.image?.original,
    }));

    return {
      id,
      title: show.name,
      type: 'series',
      tagline: show.network?.name ? `A ${show.network.name} Original Presentation` : 'Acclaimed Television Series',
      synopsis: cleanSummary || 'Critically acclaimed dramatic television series.',
      releaseYear,
      maturityRating: show.type === 'Animation' ? 'PG' : 'TV-MA',
      matchScore: ratingScore,
      totalSeasons: show.status === 'Ended' ? 3 : 1,
      genres: show.genres?.length ? show.genres : ['Drama', 'Thriller'],
      backdropUrl: show.image?.original,
      posterUrl: show.image?.medium || show.image?.original,
      trailerVideoUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
      trailerUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
      videoStreamUrl: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
      isTrending: rank !== undefined ? rank <= 5 : false,
      isTop10: rank !== undefined && rank <= 10,
      top10Rank: rank && rank <= 10 ? rank : undefined,
      isNewRelease: releaseYear >= 2024,
      isOriginal: Boolean(show.webChannel?.name?.toLowerCase().includes('netflix')),
      qualities: ['4K Ultra HD', 'Spatial Audio'],
      cast: cast.length ? cast : [{ id: 'c1', name: 'Series Ensemble', character: 'Principal Cast', role: 'Lead' }],
      directors: [show.network?.name || 'Studio Production'],
      audioLanguages: ['English (Original)', 'Spanish', 'French'],
      subtitleLanguages: ['English [CC]', 'Spanish'],
      episodes: episodes.length ? episodes : undefined,
    };
  }
}

export const tvmazeService = new TvmazeService();
