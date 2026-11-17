import 'dotenv/config';
import { closeMongo, getMongoDb, getMongoStatus } from '../sf_backend/db/mongo.client';
import { s3Storage } from '../sf_backend/storage/s3.storage';

const COLLECTIONS = [
  'movies',
  'users',
  'podcasts',
  'api_cache',
  'media_assets',
  'watch_progress_telemetry',
] as const;

async function verifyMongo(): Promise<boolean> {
  const status = getMongoStatus();
  console.log('[Verify] MongoDB configured:', status.configured);
  console.log('[Verify] MongoDB database:', status.database ?? 'unknown');

  const db = await getMongoDb();
  if (!db) {
    console.error('[Verify] MongoDB is not reachable.');
    return false;
  }

  await db.command({ ping: 1 });
  console.log('[Verify] MongoDB ping: OK');

  for (const collectionName of COLLECTIONS) {
    const count = await db.collection(collectionName).estimatedDocumentCount();
    console.log(`[Verify] ${collectionName}: ${count} documents`);
  }

  return true;
}

async function verifyS3(): Promise<boolean> {
  const status = s3Storage.getStatus();
  console.log('[Verify] S3 configured:', status.configured);
  console.log('[Verify] S3 bucket:', status.bucket ?? 'unknown');
  console.log('[Verify] S3 region:', status.region ?? 'unknown');

  if (!status.configured) {
    console.warn('[Verify] S3 is not configured; skipping object round trip.');
    return true;
  }

  const bucketCheck = await s3Storage.verifyBucket();
  if (!bucketCheck.ok) {
    console.error('[Verify] S3 bucket check failed:', bucketCheck.error);
    return false;
  }
  console.log('[Verify] S3 bucket check: OK');

  const key = `_healthcheck/verify-${Date.now()}.txt`;
  const body = `streamflix-storage-verification ${new Date().toISOString()}`;

  try {
    await s3Storage.putObject(key, body, 'text/plain');
    console.log('[Verify] S3 put: OK');

    const head = await s3Storage.headObject(key);
    console.log(
      `[Verify] S3 head: exists=${head.exists} bytes=${head.contentLength ?? 'unknown'}`,
    );

    if (!head.exists) {
      console.error('[Verify] S3 object missing after upload.');
      return false;
    }
  } finally {
    try {
      await s3Storage.deleteObject(key);
      console.log('[Verify] S3 delete: OK');
    } catch (error) {
      console.warn(
        '[Verify] S3 cleanup failed:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return true;
}

async function main(): Promise<void> {
  const mongoOk = await verifyMongo();
  const s3Ok = await verifyS3();

  if (!mongoOk || !s3Ok) {
    process.exitCode = 1;
    return;
  }

  console.log('[Verify] Storage verification passed.');
}

main()
  .catch((error) => {
    console.error(
      '[Verify] Storage verification failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongo();
  });
