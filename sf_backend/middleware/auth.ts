import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { getEnvConfig } from '../config/env';
import { ACCESS_COOKIE, readCookie } from '../auth/cookies';
import { authService } from '../modules/auth/auth.service';
import type { User } from '../types';

export async function getCurrentUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = bearerToken || readCookie(req, ACCESS_COOKIE);
  if (!token) return null;

  return authService.getUserFromAccessToken(token);
}

function secureEquals(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export function isAdminRequest(req: Request): boolean {
  const secret = (req.headers['x-admin-secret'] ||
    req.headers['x-admin-key'] ||
    req.headers.authorization?.replace('Bearer ', '')) as string | undefined;
  const { adminSecretKey } = getEnvConfig();
  return Boolean(secret && adminSecretKey && secureEquals(secret, adminSecretKey));
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (isAdminRequest(req)) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: { message: 'Unauthorized: Valid X-Admin-Secret header or credential required.' },
  });
}
