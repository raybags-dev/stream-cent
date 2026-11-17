import { Collection } from 'mongodb';
import { Title } from '../types';
import { getMongoDatabaseName, getMongoDb, isMongoConfigured } from './mongo.client';
import { SEED_TITLES } from '../data/catalog.seed';

export interface StoredMovieRecord {
  titleId: string;
  data: Title;
  cachedAt: number;
  expiresAt: number; // 24-hour refresh window
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours in ms

const VERIFIED_MP4_STREAMS = [
  'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
  'https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://media.w3.org/2010/05/video/movie_300.mp4',
  'https://vjs.zencdn.net/v/oceans.mp4',
];

function isDeadLegacyStream(url?: string): boolean {
  if (!url) return true;
  return (
    url.includes('commondatastorage.googleapis.com/gtv-videos-bucket') ||
    url.includes('storage.googleapis.com/gtv-videos-bucket')
  );
}

export function sanitizeTitleMediaUrls(title: Title): Title {
  const seed = Math.abs(
    title.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0),
  );
  const fallbackStream = VERIFIED_MP4_STREAMS[seed % VERIFIED_MP4_STREAMS.length]!;

  const videoStreamUrl = isDeadLegacyStream(title.videoStreamUrl)
    ? fallbackStream
    : title.videoStreamUrl;

  const trailerCandidate = title.trailerVideoUrl || title.trailerUrl;
  const trailerVideoUrl = isDeadLegacyStream(trailerCandidate)
    ? fallbackStream
    : trailerCandidate;

  return {
    ...title,
    videoStreamUrl,
    trailerVideoUrl,
    trailerUrl: trailerVideoUrl,
  };
}

function isUsableRecord(
  record: StoredMovieRecord | null | undefined,
): record is StoredMovieRecord {
  const posterUrl = record?.data?.posterUrl;
  return Boolean(
    record?.titleId &&
      record.data &&
      posterUrl &&
      posterUrl.trim() !== '' &&
      !posterUrl.includes('undefined'),
  );
}

export class MongoMovieStorage {
  private collection: Collection<StoredMovieRecord> | null = null;
  private memoryCache: Map<string, StoredMovieRecord> = new Map();
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async (): Promise<void> => {
      const db = await getMongoDb();
      if (!db) {
        console.warn(
          '[Mongo Storage] MongoDB is unavailable; movie catalog will use in-memory seeds until the next restart.',
        );
        this.initialized = true;
        return;
      }

      this.collection = db.collection<StoredMovieRecord>('movies');

      try {
        const records = await this.collection.find({}).toArray();
        for (const record of records) {
          if (!isUsableRecord(record)) continue;
          this.memoryCache.set(record.titleId, {
            ...record,
            data: sanitizeTitleMediaUrls(record.data),
          });
        }
        console.log(
          `[Mongo Storage] Hydrated ${this.memoryCache.size} movie records from MongoDB.`,
        );
      } catch (error) {
        console.warn(
          '[Mongo Storage] Unable to hydrate movie records from MongoDB:',
          error instanceof Error ? error.message : String(error),
        );
      }

      if (this.memoryCache.size === 0) {
        await this.saveTitles(SEED_TITLES);
      }

      this.initialized = true;
    })();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getTitleById(id: string): Promise<Title | null> {
    await this.ensureInitialized();

    const cached = this.memoryCache.get(id);
    if (isUsableRecord(cached)) return cached.data;

    if (!this.collection) return null;

    try {
      const found = await this.collection.findOne({ titleId: id });
      if (!isUsableRecord(found)) return null;

      const normalized: StoredMovieRecord = {
        ...found,
        data: sanitizeTitleMediaUrls(found.data),
      };
      this.memoryCache.set(id, normalized);
      return normalized.data;
    } catch (error) {
      console.warn(
        '[Mongo Storage] Remote lookup error:',
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  async findLocalTitles(criteria: {
    search?: string;
    genre?: string;
    year?: number | string;
    type?: string;
    isTrending?: boolean;
    isTop10?: boolean;
    isNewRelease?: boolean;
    sortBy?: string;
    limit?: number;
  }): Promise<Title[]> {
    await this.ensureInitialized();

    let titles = this.getAllValidTitles();

    if (criteria.type) {
      titles = titles.filter((title) => title.type === criteria.type);
    }

    if (criteria.genre && criteria.genre.toLowerCase() !== 'all') {
      const genre = criteria.genre.toLowerCase();
      titles = titles.filter((title) =>
        title.genres.some(
          (item) =>
            item.toLowerCase() === genre || item.toLowerCase().includes(genre),
        ),
      );
    }

    if (criteria.year) {
      const year =
        typeof criteria.year === 'string'
          ? parseInt(criteria.year, 10)
          : criteria.year;
      if (!Number.isNaN(year)) {
        titles = titles.filter((title) => title.releaseYear === year);
      }
    }

    if (criteria.search && criteria.search.trim() !== '') {
      const query = criteria.search.toLowerCase().trim();
      titles = titles.filter(
        (title) =>
          title.title.toLowerCase().includes(query) ||
          title.synopsis.toLowerCase().includes(query) ||
          title.genres.some((genre) => genre.toLowerCase().includes(query)) ||
          title.cast.some((member) =>
            member.name.toLowerCase().includes(query),
          ) ||
          title.directors.some((director) =>
            director.toLowerCase().includes(query),
          ),
      );
    }

    if (criteria.isTrending) {
      titles = titles.filter((title) => title.isTrending);
    }
    if (criteria.isTop10) {
      titles = titles
        .filter((title) => title.isTop10)
        .sort((a, b) => (a.top10Rank || 99) - (b.top10Rank || 99));
    }
    if (criteria.isNewRelease) {
      titles = titles.filter((title) => title.isNewRelease);
    }

    if (criteria.sortBy) {
      if (criteria.sortBy === 'popularity' || criteria.sortBy === 'match') {
        titles.sort((a, b) => b.matchScore - a.matchScore);
      } else if (criteria.sortBy === 'year') {
        titles.sort((a, b) => b.releaseYear - a.releaseYear);
      } else if (criteria.sortBy === 'title') {
        titles.sort((a, b) => a.title.localeCompare(b.title));
      }
    }

    if (criteria.limit && criteria.limit > 0) {
      titles = titles.slice(0, criteria.limit);
    }

    return titles;
  }

  async saveTitles(newTitles: Title[]): Promise<void> {
    await this.ensureInitialized();

    const now = Date.now();
    const expiresAt = now + CACHE_TTL_MS;
    const operations: Array<{
      updateOne: {
        filter: { titleId: string };
        update: { $set: StoredMovieRecord };
        upsert: true;
      };
    }> = [];

    for (const title of newTitles) {
      if (
        !title.posterUrl ||
        title.posterUrl.trim() === '' ||
        title.posterUrl.includes('undefined')
      ) {
        continue;
      }

      const sanitizedTitle = sanitizeTitleMediaUrls(title);
      const record: StoredMovieRecord = {
        titleId: sanitizedTitle.id,
        data: sanitizedTitle,
        cachedAt: now,
        expiresAt,
      };

      this.memoryCache.set(sanitizedTitle.id, record);
      operations.push({
        updateOne: {
          filter: { titleId: sanitizedTitle.id },
          update: { $set: record },
          upsert: true,
        },
      });
    }

    if (operations.length === 0 || !this.collection) return;

    try {
      await this.collection.bulkWrite(operations, { ordered: false });
    } catch (error) {
      console.warn(
        '[Mongo Storage] Bulk write note:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  hasValidTitle(id: string): boolean {
    return isUsableRecord(this.memoryCache.get(id));
  }

  getAllValidTitles(): Title[] {
    return Array.from(this.memoryCache.values())
      .filter(isUsableRecord)
      .map((record) => record.data);
  }

  getConnectionStatus(): {
    configured: boolean;
    connected: boolean;
    database: string;
    cachedRecords: number;
  } {
    return {
      configured: isMongoConfigured(),
      connected: Boolean(this.collection),
      database: getMongoDatabaseName(),
      cachedRecords: this.memoryCache.size,
    };
  }
}

export const mongoMovieStorage = new MongoMovieStorage();
