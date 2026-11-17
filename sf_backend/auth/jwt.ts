import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getEnvConfig } from '../config/env';
import type { User } from '../types';

export type TokenKind = 'access' | 'refresh';

export interface VerifiedToken {
  sub: string;
  email: string;
  role: 'superuser' | 'user';
  ver: number;
  typ: TokenKind;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;
}

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
}

const ISSUER = 'streamflix-api';
const AUDIENCE = 'streamflix-web';
const CLOCK_SKEW_SECONDS = 30;
const ephemeralSecrets = new Map<TokenKind, string>();

function secretFor(kind: TokenKind): string {
  const config = getEnvConfig();
  const configured =
    kind === 'access' ? config.jwtAccessSecret : config.jwtRefreshSecret;

  if (configured) return configured;

  if (config.isProduction) {
    throw new Error(
      `Missing ${kind === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET'} in production.`,
    );
  }

  const existing = ephemeralSecrets.get(kind);
  if (existing) return existing;

  const generated = randomBytes(32).toString('hex');
  ephemeralSecrets.set(kind, generated);
  console.warn(
    `[Auth] ${kind === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET'} is not configured; using an ephemeral development secret.`,
  );
  return generated;
}

function encodeBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function signSegment(input: string, secret: string): string {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function tokenTtl(kind: TokenKind): number {
  const config = getEnvConfig();
  return kind === 'access' ? config.jwtAccessTtlSeconds : config.jwtRefreshTtlSeconds;
}

export function roleForEmail(email: string): 'superuser' | 'user' {
  return email.toLowerCase() === getEnvConfig().adminEmail ? 'superuser' : 'user';
}

export function signToken(user: User, tokenVersion: number, kind: TokenKind): string {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: 'HS256', typ: 'JWT' };
  const payload: VerifiedToken = {
    sub: user.id,
    email: user.email.toLowerCase(),
    role: roleForEmail(user.email),
    ver: tokenVersion,
    typ: kind,
    iat: now,
    exp: now + tokenTtl(kind),
    iss: ISSUER,
    aud: AUDIENCE,
    jti: randomBytes(16).toString('hex'),
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = signSegment(unsigned, secretFor(kind));
  return `${unsigned}.${signature}`;
}

function readPayload(raw: string): VerifiedToken | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(raw).toString('utf8'));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const value = parsed as Record<string, unknown>;
  if (
    typeof value.sub !== 'string' ||
    typeof value.email !== 'string' ||
    (value.role !== 'superuser' && value.role !== 'user') ||
    typeof value.ver !== 'number' ||
    (value.typ !== 'access' && value.typ !== 'refresh') ||
    typeof value.iat !== 'number' ||
    typeof value.exp !== 'number' ||
    typeof value.iss !== 'string' ||
    typeof value.aud !== 'string' ||
    typeof value.jti !== 'string'
  ) {
    return null;
  }

  return {
    sub: value.sub,
    email: value.email,
    role: value.role,
    ver: value.ver,
    typ: value.typ,
    iat: value.iat,
    exp: value.exp,
    iss: value.iss,
    aud: value.aud,
    jti: value.jti,
  };
}

export function verifyToken(token: string, expectedKind: TokenKind): VerifiedToken | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, providedSignature] = parts as [
    string,
    string,
    string,
  ];

  let header: unknown;
  try {
    header = JSON.parse(decodeBase64Url(encodedHeader).toString('utf8'));
  } catch {
    return null;
  }

  if (
    !header ||
    typeof header !== 'object' ||
    (header as Record<string, unknown>).alg !== 'HS256' ||
    (header as Record<string, unknown>).typ !== 'JWT'
  ) {
    return null;
  }

  let secret: string;
  try {
    secret = secretFor(expectedKind);
  } catch {
    return null;
  }

  const expectedSignature = signSegment(`${encodedHeader}.${encodedPayload}`, secret);
  if (!safeEqual(providedSignature, expectedSignature)) return null;

  const payload = readPayload(encodedPayload);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (payload.typ !== expectedKind) return null;
  if (payload.iss !== ISSUER || payload.aud !== AUDIENCE) return null;
  if (payload.exp <= now - CLOCK_SKEW_SECONDS) return null;
  if (payload.iat > now + CLOCK_SKEW_SECONDS) return null;

  return payload;
}
