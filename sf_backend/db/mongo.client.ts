import { Db, IndexSpecification, MongoClient } from 'mongodb';

const DEFAULT_DATABASE = 'streamflix';
const TEST_DATABASE = 'streamflix_test';

interface CollectionIndex {
  collection: string;
  key: IndexSpecification;
  unique?: boolean;
  expireAfterSeconds?: number;
}

const COLLECTION_INDEXES: CollectionIndex[] = [
  { collection: 'movies', key: { titleId: 1 }, unique: true },
  { collection: 'movies', key: { expiresAt: 1 } },
  { collection: 'users', key: { email: 1 }, unique: true },
  { collection: 'podcasts', key: { id: 1 }, unique: true },
  { collection: 'api_cache', key: { key: 1 }, unique: true },
  { collection: 'api_cache', key: { expiresAt: 1 }, expireAfterSeconds: 0 },
  { collection: 'media_assets', key: { assetId: 1 }, unique: true },
  { collection: 'media_assets', key: { ownerId: 1, createdAt: -1 } },
  { collection: 'media_assets', key: { status: 1 } },
  {
    collection: 'watch_progress_telemetry',
    key: { userId: 1, titleId: 1 },
    unique: true,
  },
  { collection: 'admin_audit', key: { createdAt: -1 } },
];

let client: MongoClient | null = null;
let database: Db | null = null;
let connectPromise: Promise<Db | null> | null = null;
let lastError: string | null = null;

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export function isMongoConfigured(): boolean {
  if (isTestEnvironment()) return false;
  const uri = process.env.MONGO_URI;
  return Boolean(uri && uri.trim().length > 0);
}

export function getMongoDatabaseName(): string {
  if (isTestEnvironment()) return TEST_DATABASE;

  const explicitName = process.env.MONGO_DB_NAME?.trim();
  if (explicitName) return explicitName;

  return DEFAULT_DATABASE;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function ensureIndexes(db: Db): Promise<void> {
  for (const spec of COLLECTION_INDEXES) {
    const collection = db.collection(spec.collection);
    const requestedKey = JSON.stringify(spec.key);

    try {
      const existing = await collection.indexes().catch(() => []);
      const matches = existing.filter(
        (index) => JSON.stringify(index.key) === requestedKey,
      );
      const match =
        matches.find((index) => !spec.unique || index.unique === true) ?? matches[0];

      if (match) {
        if (spec.unique && match.unique !== true) {
          console.warn(
            `[MongoDB] Existing index on ${spec.collection} is not unique; uniqueness is not enforced by this run.`,
          );
        }
        if (
          spec.expireAfterSeconds !== undefined &&
          match.expireAfterSeconds !== spec.expireAfterSeconds
        ) {
          console.warn(
            `[MongoDB] Existing index on ${spec.collection} does not match the requested TTL.`,
          );
        }
        continue;
      }

      const options = {
        ...(spec.unique ? { unique: true } : {}),
        ...(spec.expireAfterSeconds !== undefined
          ? { expireAfterSeconds: spec.expireAfterSeconds }
          : {}),
      };

      await collection.createIndex(spec.key, options);
    } catch (error) {
      console.warn(
        `[MongoDB] Index note for ${spec.collection}:`,
        describeError(error),
      );
    }
  }
}

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured()) return null;
  if (database) return database;
  if (connectPromise) return connectPromise;

  const uri = process.env.MONGO_URI?.trim();
  if (!uri) return null;

  connectPromise = (async (): Promise<Db | null> => {
    try {
      const nextClient = new MongoClient(uri, {
        connectTimeoutMS: 8000,
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 20,
      });

      await nextClient.connect();
      const nextDatabase = nextClient.db(getMongoDatabaseName());

      await ensureIndexes(nextDatabase);

      client = nextClient;
      database = nextDatabase;
      lastError = null;

      console.log(
        `[MongoDB] Connected to database "${getMongoDatabaseName()}" and verified indexes.`,
      );
      return nextDatabase;
    } catch (error) {
      lastError = describeError(error);
      console.warn('[MongoDB] Connection unavailable:', lastError);
      client = null;
      database = null;
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export function getMongoStatus(): {
  configured: boolean;
  connected: boolean;
  database: string;
  lastError: string | null;
} {
  return {
    configured: isMongoConfigured(),
    connected: Boolean(database),
    database: getMongoDatabaseName(),
    lastError,
  };
}

export async function closeMongo(): Promise<void> {
  if (client) {
    await client.close().catch(() => undefined);
  }
  client = null;
  database = null;
  connectPromise = null;
}
