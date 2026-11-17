import { createHash } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../cache/redis.client';

interface CachedIdempotencyResponse {
  statusCode: number;
  body: unknown;
  timestamp: number;
}

const idempotencyStore = new Map<string, CachedIdempotencyResponse>();
const IDEMPOTENCY_TTL_SECONDS = 60 * 60;
const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

function cacheKey(rawKey: string): string {
  return `idempotency:${createHash('sha256').update(rawKey).digest('hex')}`;
}

function parseCached(value: string | null): CachedIdempotencyResponse | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as CachedIdempotencyResponse).statusCode !== 'number' ||
      typeof (parsed as CachedIdempotencyResponse).timestamp !== 'number'
    ) {
      return null;
    }
    return parsed as CachedIdempotencyResponse;
  } catch {
    return null;
  }
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const headerValue = req.headers['idempotency-key'] ?? req.headers['x-idempotency-key'];
  const idempotencyKey = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (!idempotencyKey || idempotencyKey.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    next();
    return;
  }

  const redis = getRedisClient();
  const redisKey = cacheKey(idempotencyKey);

  try {
    if (redis) {
      const cached = parseCached(await redis.get(redisKey));
      if (cached && Date.now() - cached.timestamp < IDEMPOTENCY_TTL_SECONDS * 1000) {
        res.setHeader('X-Cache-Lookup', 'HIT');
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    } else {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && Date.now() - cached.timestamp < IDEMPOTENCY_TTL_SECONDS * 1000) {
        res.setHeader('X-Cache-Lookup', 'HIT');
        res.setHeader('X-Idempotent-Replay', 'true');
        res.status(cached.statusCode).json(cached.body);
        return;
      }
    }
  } catch (error) {
    console.warn(
      '[Idempotency] Redis lookup failed; using memory fallback:',
      error instanceof Error ? error.message : String(error),
    );
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 500) {
      const record: CachedIdempotencyResponse = {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      };
      idempotencyStore.set(idempotencyKey, record);

      if (redis) {
        redis
          .set(redisKey, JSON.stringify(record), { EX: IDEMPOTENCY_TTL_SECONDS })
          .catch((error: unknown) => {
            console.warn(
              '[Idempotency] Redis write failed:',
              error instanceof Error ? error.message : String(error),
            );
          });
      }
    }
    return originalJson(body);
  }) as Response['json'];

  next();
}
