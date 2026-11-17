import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mongoMovieStorage } from '../sf_backend/db/mongo.storage';
import { cacheManager } from '../sf_backend/cache/cache';
import { closeMongo, getMongoStatus } from '../sf_backend/db/mongo.client';
import type { Title } from '../sf_backend/types';

interface DiskMovieRecord {
  titleId: string;
  cachedAt: number;
  expiresAt: number;
  data: Title;
}

interface DiskCacheEntry {
  value: unknown;
  expiresAt: number;
}

interface DiskCacheFile {
  [key: string]: DiskCacheEntry;
}

const PROJECT_ROOT = process.cwd();
const MOVIE_CACHE_PATH = path.join(
  PROJECT_ROOT,
  '.cache',
  'mongodb_movies_store.json',
);
const API_CACHE_PATH = path.join(
  PROJECT_ROOT,
  '.cache',
  'streamflix_api_cache.json',
);

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(
      `[Migration] Unable to read ${path.basename(filePath)}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function extractMovies(raw: unknown): Title[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => entry as DiskMovieRecord)
      .filter((entry) => entry?.data?.id && entry.data.posterUrl)
      .map((entry) => entry.data);
  }

  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, DiskMovieRecord>)
      .filter((entry) => entry?.data?.id && entry.data.posterUrl)
      .map((entry) => entry.data);
  }

  return [];
}

function extractCacheEntries(raw: unknown): Array<{ key: string; value: unknown; ttlSeconds: number }> {
  if (!raw || typeof raw !== 'object') return [];

  const now = Date.now();
  const entries: Array<{ key: string; value: unknown; ttlSeconds: number }> = [];

  for (const [key, entry] of Object.entries(raw as DiskCacheFile)) {
    if (!entry || typeof entry !== 'object') continue;
    const ttlSeconds = Math.floor((entry.expiresAt - now) / 1000);
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) continue;
    entries.push({ key, value: entry.value, ttlSeconds });
  }

  return entries;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const mongoStatus = getMongoStatus();

  console.log('[Migration] Target database:', mongoStatus.database ?? 'unknown');
  console.log('[Migration] Dry run:', dryRun);

  const movieRaw = await readJson<unknown>(MOVIE_CACHE_PATH);
  const cacheRaw = await readJson<unknown>(API_CACHE_PATH);

  const movies = extractMovies(movieRaw);
  const cacheEntries = extractCacheEntries(cacheRaw);

  console.log(`[Migration] Movies ready to migrate: ${movies.length}`);
  console.log(`[Migration] API cache entries ready to migrate: ${cacheEntries.length}`);

  if (movies.length === 0 && cacheEntries.length === 0) {
    console.log('[Migration] Nothing to migrate.');
    return;
  }

  if (dryRun) {
    console.log('[Migration] Dry run complete; no documents were written.');
    return;
  }

  await mongoMovieStorage.initialize();
  await mongoMovieStorage.saveTitles(movies);
  console.log(`[Migration] Wrote ${movies.length} movie records.`);

  await cacheManager.initialize();
  for (const entry of cacheEntries) {
    cacheManager.set(entry.key, entry.value, entry.ttlSeconds);
  }
  await cacheManager.flush();
  console.log(`[Migration] Wrote ${cacheEntries.length} API cache entries.`);

  const storedMovies = mongoMovieStorage.getAllValidTitles().length;
  console.log(`[Migration] Movies now available in memory: ${storedMovies}`);
}

main()
  .catch((error) => {
    console.error(
      '[Migration] Failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongo();
  });
