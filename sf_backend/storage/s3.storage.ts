import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type MediaKind = 'video' | 'audio' | 'image' | 'hls';

export interface S3Config {
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  publicBaseUrl?: string;
}

export interface UploadValidationInput {
  fileName: string;
  contentType: string;
  size: number;
  kind: MediaKind;
}

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

const MEBIBYTE = 1024 * 1024;
const GIBIBYTE = 1024 * MEBIBYTE;

const UPLOAD_RULES: Record<
  MediaKind,
  { contentTypes: string[]; extensions: string[]; maxBytes: number }
> = {
  video: {
    contentTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska',
    ],
    extensions: ['.mp4', '.webm', '.mov', '.mkv'],
    maxBytes: 5 * GIBIBYTE,
  },
  audio: {
    contentTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'],
    extensions: ['.mp3', '.m4a', '.wav', '.ogg'],
    maxBytes: 500 * MEBIBYTE,
  },
  image: {
    contentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxBytes: 20 * MEBIBYTE,
  },
  hls: {
    contentTypes: [
      'application/vnd.apple.mpegurl',
      'application/x-mpegurl',
      'video/mp2t',
    ],
    extensions: ['.m3u8', '.ts'],
    maxBytes: 2 * GIBIBYTE,
  },
};

let cachedClient: S3Client | null = null;
let cachedConfig: S3Config | null = null;

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function getS3Config(): S3Config | null {
  const bucket = cleanEnv(process.env.S3_BUCKET) ?? cleanEnv(process.env.AWS_BUCKET_NAME);
  const region =
    cleanEnv(process.env.AWS_REGION) ?? cleanEnv(process.env.S3_REGION) ?? 'eu-central-1';
  const accessKeyId =
    cleanEnv(process.env.S3_ACCESS_KEY) ?? cleanEnv(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey =
    cleanEnv(process.env.S3_SECRET_KEY) ?? cleanEnv(process.env.AWS_SECRET_ACCESS_KEY);

  if (!bucket || !accessKeyId || !secretAccessKey) return null;

  return {
    region,
    bucket,
    endpoint: cleanEnv(process.env.S3_ENDPOINT),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    publicBaseUrl: cleanEnv(process.env.S3_PUBLIC_BASE_URL),
  };
}

function requireConfig(): S3Config {
  const config = getS3Config();
  if (!config) {
    throw new Error(
      'S3 storage is not configured. Provide S3_BUCKET (or AWS_BUCKET_NAME), a region, and access credentials.',
    );
  }
  return config;
}

function getClient(): S3Client {
  const config = requireConfig();
  if (cachedClient && cachedConfig) return cachedClient;

  const accessKeyId =
    cleanEnv(process.env.S3_ACCESS_KEY) ?? cleanEnv(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey =
    cleanEnv(process.env.S3_SECRET_KEY) ?? cleanEnv(process.env.AWS_SECRET_ACCESS_KEY);

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('S3 storage credentials are incomplete.');
  }

  cachedClient = new S3Client({
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });
  cachedConfig = config;
  return cachedClient;
}

export function sanitizeKeySegment(value: string, fallback: string): string {
  const safe = value
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^[.-]+/, '')
    .replace(/[.-]+$/, '')
    .slice(0, 96);
  return safe.length > 0 ? safe : fallback;
}

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split(/[/\\]/).pop() ?? 'upload';
  return sanitizeKeySegment(baseName, 'upload');
}

export function buildObjectKey(
  ownerId: string,
  kind: MediaKind,
  assetId: string,
  fileName: string,
): string {
  const owner = sanitizeKeySegment(ownerId, 'anonymous');
  const asset = sanitizeKeySegment(assetId, 'asset');
  const safeName = sanitizeFileName(fileName);
  return `media/${owner}/${kind}/${asset}/${safeName}`;
}

export function validateUpload(input: UploadValidationInput): UploadValidationResult {
  const rules = UPLOAD_RULES[input.kind];
  if (!rules) {
    return { valid: false, error: `Unsupported media kind "${input.kind}".` };
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { valid: false, error: 'File size must be a positive number.' };
  }

  if (input.size > rules.maxBytes) {
    return {
      valid: false,
      error: `File exceeds the ${rules.maxBytes / MEBIBYTE} MiB limit for ${input.kind}.`,
    };
  }

  const contentType = input.contentType.trim().toLowerCase();
  if (!rules.contentTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Unsupported content type "${input.contentType}" for ${input.kind}.`,
    };
  }

  const fileName = sanitizeFileName(input.fileName).toLowerCase();
  const extension = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';
  if (!rules.extensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file extension "${extension || '(none)'}" for ${input.kind}.`,
    };
  }

  return { valid: true };
}

export class S3StorageService {
  isConfigured(): boolean {
    return getS3Config() !== null;
  }

  getStatus(): { configured: boolean; bucket: string | null; region: string | null } {
    const config = getS3Config();
    return {
      configured: Boolean(config),
      bucket: config?.bucket ?? null,
      region: config?.region ?? null,
    };
  }

  async verifyBucket(): Promise<{ ok: boolean; error?: string }> {
    try {
      const config = requireConfig();
      await getClient().send(new HeadBucketCommand({ Bucket: config.bucket }));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async presignUpload(
    key: string,
    contentType: string,
    expiresInSeconds = 900,
  ): Promise<string> {
    const config = requireConfig();
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(getClient(), command, { expiresIn: expiresInSeconds });
  }

  async presignDownload(
    key: string,
    options: { fileName?: string; expiresInSeconds?: number } = {},
  ): Promise<string> {
    const config = requireConfig();
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ...(options.fileName
        ? {
            ResponseContentDisposition: `attachment; filename="${sanitizeFileName(
              options.fileName,
            )}"`,
          }
        : {}),
    });
    return getSignedUrl(getClient(), command, {
      expiresIn: options.expiresInSeconds ?? 900,
    });
  }

  async putObject(
    key: string,
    body: Buffer | Uint8Array | string,
    contentType: string,
  ): Promise<void> {
    const config = requireConfig();
    await getClient().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async headObject(
    key: string,
  ): Promise<{ exists: boolean; contentLength: number | null; contentType: string | null }> {
    try {
      const config = requireConfig();
      const result = await getClient().send(
        new HeadObjectCommand({ Bucket: config.bucket, Key: key }),
      );
      return {
        exists: true,
        contentLength: result.ContentLength ?? null,
        contentType: result.ContentType ?? null,
      };
    } catch {
      return { exists: false, contentLength: null, contentType: null };
    }
  }

  async objectExists(key: string): Promise<boolean> {
    const result = await this.headObject(key);
    return result.exists;
  }

  async deleteObject(key: string): Promise<void> {
    const config = requireConfig();
    await getClient().send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
  }

  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const config = requireConfig();

    for (let index = 0; index < keys.length; index += 1000) {
      const batch = keys.slice(index, index + 1000);
      await getClient().send(
        new DeleteObjectsCommand({
          Bucket: config.bucket,
          Delete: { Objects: batch.map((key) => ({ Key: key })), Quiet: true },
        }),
      );
    }
  }

  async listObjects(prefix: string): Promise<string[]> {
    const config = requireConfig();
    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const result = await getClient().send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of result.Contents ?? []) {
        if (object.Key) keys.push(object.Key);
      }
      continuationToken = result.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }
}

export const s3Storage = new S3StorageService();
