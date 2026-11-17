import { Collection } from 'mongodb';
import { getMongoDb } from '../db/mongo.client';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheDocument {
  key: string;
  value: unknown;
  expiresAt: Date;
  updatedAt: Date;
}

const DEFAULT_TTL_SECONDS = 86_400; // 24 hours
const CACHE_COLLECTION = 'api_cache';

export class CacheManager {
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map();
  private collection: Collection<CacheDocument> | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private readonly pendingWrites: Set<Promise<unknown>> = new Set();

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async (): Promise<void> => {
      const db = await getMongoDb();
      if (!db) {
        console.warn(
          '[Cache Layer] MongoDB is unavailable; API responses will be cached in memory only.',
        );
        this.initialized = true;
        return;
      }

      this.collection = db.collection<CacheDocument>(CACHE_COLLECTION);

      try {
        const now = new Date();
        const documents = await this.collection
          .find({ expiresAt: { $gt: now } })
          .toArray();

        for (const document of documents) {
          this.cache.set(document.key, {
            value: document.value,
            expiresAt: document.expiresAt.getTime(),
          });
        }

        console.log(
          `[Cache Layer] Hydrated ${this.cache.size} valid entries from MongoDB.`,
        );
      } catch (error) {
        console.warn(
          '[Cache Layer] Unable to hydrate MongoDB cache:',
          error instanceof Error ? error.message : String(error),
        );
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

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      void this.removeExpiredDocument(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): void {
    const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0
      ? ttlSeconds
      : DEFAULT_TTL_SECONDS;
    const expiresAt = Date.now() + ttl * 1000;

    this.cache.set(key, { value, expiresAt });

    if (!this.collection) {
      void this.ensureInitialized().then(() => this.persistEntry(key, value, expiresAt));
      return;
    }

    this.persistEntry(key, value, expiresAt);
  }

  private persistEntry<T>(key: string, value: T, expiresAt: number): void {
    if (!this.collection) return;

    const write = this.collection
      .updateOne(
        { key },
        {
          $set: {
            key,
            value,
            expiresAt: new Date(expiresAt),
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
      .catch((error: unknown) => {
        console.warn(
          '[Cache Layer] MongoDB write note:',
          error instanceof Error ? error.message : String(error),
        );
      });

    this.pendingWrites.add(write);
    void write.finally(() => this.pendingWrites.delete(write));
  }

  private async removeExpiredDocument(key: string): Promise<void> {
    if (!this.collection) return;
    try {
      await this.collection.deleteOne({ key });
    } catch {
      // MongoDB TTL index will eventually remove the stale document.
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    if (!this.collection) return;

    const write = this.collection.deleteMany({}).catch((error: unknown) => {
      console.warn(
        '[Cache Layer] MongoDB clear note:',
        error instanceof Error ? error.message : String(error),
      );
    });
    this.pendingWrites.add(write);
    void write.finally(() => this.pendingWrites.delete(write));
  }

  async flush(): Promise<void> {
    await Promise.all(Array.from(this.pendingWrites));
  }

  getStatus(): { connected: boolean; entries: number } {
    return {
      connected: Boolean(this.collection),
      entries: this.cache.size,
    };
  }
}

export const cacheManager = new CacheManager();
