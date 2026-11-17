import { createClient } from 'redis';
import { getEnvConfig } from '../config/env';

// Minimal structural surface used by this app (rate limiting + idempotency cache).
interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options: { EX: number }): Promise<unknown>;
  quit(): Promise<unknown>;
  destroy(): void;
}

interface RedisStatus {
  configured: boolean;
  connected: boolean;
  url: string;
}

let client: RedisClient | null = null;
let connected = false;
let initializing: Promise<void> | null = null;

function redactRedisUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.password) url.password = '<redacted>';
    return url.toString();
  } catch {
    return '<invalid>';
  }
}

function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

export async function initializeRedis(): Promise<void> {
  if (connected || initializing) {
    if (initializing) await initializing;
    return;
  }

  const { redisUrl } = getEnvConfig();
  if (!redisUrl || isTestMode()) return;

  initializing = (async (): Promise<void> => {
    const nextClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
      },
    });

    nextClient.on('error', (error: Error) => {
      console.warn('[Redis] Client error:', error.message);
    });
    nextClient.on('end', () => {
      connected = false;
    });

    try {
      await Promise.race([
        nextClient.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timed out.')), 5_000),
        ),
      ]);
      client = nextClient;
      connected = true;
      console.log(`[Redis] Connected to ${redactRedisUrl(redisUrl)}.`);
    } catch (error) {
      connected = false;
      client = null;
      try {
        nextClient.destroy();
      } catch {
        // best-effort cleanup
      }
      console.warn(
        '[Redis] Unavailable; falling back to in-memory rate limiting/idempotency:',
        error instanceof Error ? error.message : String(error),
      );
    }
  })();

  try {
    await initializing;
  } finally {
    initializing = null;
  }
}

export function getRedisClient(): RedisClient | null {
  return connected ? client : null;
}

export async function closeRedis(): Promise<void> {
  if (!client) {
    connected = false;
    return;
  }

  const activeClient = client;
  client = null;
  connected = false;
  try {
    await activeClient.quit();
  } catch {
    try {
      activeClient.destroy();
    } catch {
      // best-effort cleanup
    }
  }
}

export function getRedisStatus(): RedisStatus {
  const { redisUrl } = getEnvConfig();
  return {
    configured: Boolean(redisUrl),
    connected,
    url: redisUrl ? redactRedisUrl(redisUrl) : '',
  };
}
