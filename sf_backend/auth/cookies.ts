import type { Request, Response } from 'express';
import { getEnvConfig } from '../config/env';

export const ACCESS_COOKIE = 'sf_access_token';
export const REFRESH_COOKIE = 'sf_refresh_token';

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

function cookieOptions(maxAgeMs: number): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: getEnvConfig().cookieSecure,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(res: Response, tokens: AuthTokenPair): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.accessExpiresIn * 1000));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshExpiresIn * 1000));
}

export function clearAuthCookies(res: Response): void {
  const options = cookieOptions(0);
  res.clearCookie(ACCESS_COOKIE, { ...options, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE, { ...options, maxAge: undefined });
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const rawValue = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return undefined;
}
