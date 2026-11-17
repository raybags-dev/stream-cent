import { catalogStore } from './data/catalog.store';
import { cacheManager } from './cache/cache';
import { closeMongo, getMongoDb } from './db/mongo.client';
import { s3Storage } from './storage/s3.storage';
import { initializeRedis, closeRedis } from './cache/redis.client';
import { authService } from './modules/auth/auth.service';

export async function initializeBackend(): Promise<void> {
  const db = await getMongoDb();
  if (!db) {
    console.warn(
      '[Bootstrap] MongoDB is not reachable. Structured data will fall back to in-memory state.',
    );
  }

  await initializeRedis();
  await cacheManager.initialize();
  await catalogStore.initialize();
  await authService.initialize();

  if (!s3Storage.isConfigured()) {
    console.warn(
      '[Bootstrap] S3 is not configured. Media upload endpoints will return 503 until storage is available.',
    );
    return;
  }

  const verification = await s3Storage.verifyBucket();
  if (verification.ok) {
    console.log('[Bootstrap] S3 bucket verified for media storage.');
  } else {
    console.warn('[Bootstrap] S3 bucket verification failed:', verification.error);
  }
}

export async function shutdownBackend(): Promise<void> {
  await cacheManager.flush();
  await closeRedis();
  await closeMongo();
}

export function registerShutdownHandlers(
  closeServer: () => Promise<void> | void,
): void {
  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[Shutdown] Received ${signal}; closing connections gracefully.`);

    try {
      await closeServer();
      await shutdownBackend();
      process.exit(0);
    } catch (error) {
      console.error(
        '[Shutdown] Graceful shutdown failed:',
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
