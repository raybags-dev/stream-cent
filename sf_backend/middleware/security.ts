import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../cache/redis.client';

export function securityHardeningMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Security Headers (Anti-Clickjacking, XSS Protection, MIME-sniff prevention)
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 2. Reject Prototype Pollution & NoSQL Injection attempts
  const checkPayloadForMaliciousKeys = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false;

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return true;
      }
      if (key.startsWith('$') && typeof child === 'object') {
        return true;
      }
      if (typeof child === 'object' && checkPayloadForMaliciousKeys(child)) {
        return true;
      }
    }
    return false;
  };

  if (req.body && checkPayloadForMaliciousKeys(req.body)) {
    console.warn(
      `[Security Guard] Blocked prototype pollution / injection payload from ${req.ip} on ${req.path}`,
    );
    res.status(400).json({
      success: false,
      error: { message: 'Malformed or forbidden input parameter detected' },
    });
    return;
  }

  // 3. Sensitive Path Protection
  if (req.path.includes('/.env') || req.path.includes('/.git') || req.path.includes('..')) {
    console.warn(`[Security Guard] Path traversal attempt blocked: ${req.path}`);
    res.status(403).json({
      success: false,
      error: { message: 'Access forbidden' },
    });
    return;
  }

  next();
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const MAX_REQUESTS = 120;
const WINDOW_SECONDS = 60;

function requestIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown-client';
}

function applyMemoryRateLimit(req: Request, res: Response): boolean {
  const clientIp = requestIp(req);
  const now = Date.now();
  let bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || now - bucket.lastRefill > WINDOW_SECONDS * 1000) {
    bucket = { tokens: MAX_REQUESTS, lastRefill: now };
    rateLimitBuckets.set(clientIp, bucket);
  }

  if (bucket.tokens <= 0) {
    res.setHeader('Retry-After', String(WINDOW_SECONDS));
    res.status(429).json({
      success: false,
      error: { message: 'Too many requests. Please slow down.' },
    });
    return false;
  }

  bucket.tokens -= 1;
  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(bucket.tokens));
  return true;
}

export async function apiRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.path === '/api/health' || !req.path.startsWith('/api')) {
    next();
    return;
  }

  const redis = getRedisClient();
  if (!redis) {
    if (applyMemoryRateLimit(req, res)) next();
    return;
  }

  const bucket = Math.floor(Date.now() / (WINDOW_SECONDS * 1000));
  const key = `ratelimit:${requestIp(req)}:${bucket}`;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - count)));

    if (count > MAX_REQUESTS) {
      res.setHeader('Retry-After', String(WINDOW_SECONDS));
      res.status(429).json({
        success: false,
        error: { message: 'Too many requests. Please slow down.' },
      });
      return;
    }

    next();
  } catch (error) {
    console.warn(
      '[RateLimit] Redis unavailable; using memory fallback:',
      error instanceof Error ? error.message : String(error),
    );
    if (applyMemoryRateLimit(req, res)) next();
  }
}
