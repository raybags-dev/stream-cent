import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { Collection } from 'mongodb';
import { getEnvConfig } from '../../config/env';
import { catalogStore } from '../../data/catalog.store';
import { getMongoDb } from '../../db/mongo.client';
import { signToken, verifyToken } from '../../auth/jwt';
import type { Plan, User } from '../../types';

export interface AuthCredential {
  email: string;
  userId: string;
  passwordHash: string;
  tokenVersion: number;
  resetTokenHash?: string;
  resetTokenExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode = 400, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const CREDENTIALS_COLLECTION = 'auth_credentials';
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 256;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const TEST_ADMIN_PASSWORD = 'StreamFlixSuperAdmin2026!';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function assertPasswordStrength(password: unknown): string {
  if (typeof password !== 'string') {
    throw new AuthError('Password is required.', 400, 'PASSWORD_REQUIRED');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      400,
      'PASSWORD_TOO_SHORT',
    );
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AuthError(
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
      400,
      'PASSWORD_TOO_LONG',
    );
  }
  return password;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? '', 'hex');
  const expected = Buffer.from(parts[5] ?? '', 'hex');
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = scryptSync(password, salt, expected.length, {
      N: n,
      r,
      p,
      maxmem: SCRYPT_MAX_MEMORY,
    });
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function isTestMode(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

function stripMongoId<T extends object>(document: T & { _id?: unknown }): T {
  const { _id, ...rest } = document;
  void _id;
  return rest as T;
}

class AuthService {
  private credentials = new Map<string, AuthCredential>();
  private collection: Collection<AuthCredential> | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = (async (): Promise<void> => {
      if (!isTestMode()) {
        const db = await getMongoDb();
        if (db) {
          this.collection = db.collection<AuthCredential>(CREDENTIALS_COLLECTION);
          try {
            await this.collection.createIndex({ email: 1 }, { unique: true });
            await this.collection.createIndex({ userId: 1 }, { unique: true });
            await this.collection.createIndex(
              { resetTokenHash: 1 },
              { sparse: true },
            );
            const documents = await this.collection.find({}).toArray();
            this.credentials.clear();
            for (const document of documents) {
              const credential = stripMongoId(document);
              if (credential.email) {
                this.credentials.set(credential.email.toLowerCase(), credential);
              }
            }
            console.log(
              `[Auth] Hydrated ${this.credentials.size} credential records from MongoDB.`,
            );
          } catch (error) {
            console.warn(
              '[Auth] Unable to hydrate credentials from MongoDB:',
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }

      await this.seedAdminCredential();
      this.initialized = true;
    })();

    try {
      await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async seedAdminCredential(): Promise<void> {
    const { adminEmail } = getEnvConfig();
    if (this.credentials.has(adminEmail)) return;

    const adminUser = catalogStore.findUserByEmail(adminEmail);
    if (!adminUser) return;

    const configuredPassword = process.env.ADMIN_PASSWORD?.trim() ?? '';
    const password = configuredPassword || (isTestMode() ? TEST_ADMIN_PASSWORD : '');
    if (!password) {
      console.warn(
        '[Auth] No admin credential exists and ADMIN_PASSWORD is not set. Admin password login is disabled until a reset is performed.',
      );
      return;
    }

    await this.saveCredential(this.buildCredential(adminUser, password, 1));
    console.log('[Auth] Seeded the root admin credential.');
  }

  private buildCredential(user: User, password: string, tokenVersion: number): AuthCredential {
    const now = new Date().toISOString();
    return {
      email: normalizeEmail(user.email),
      userId: user.id,
      passwordHash: hashPassword(password),
      tokenVersion,
      createdAt: now,
      updatedAt: now,
    };
  }

  private async saveCredential(credential: AuthCredential): Promise<void> {
    credential.updatedAt = new Date().toISOString();
    this.credentials.set(credential.email, credential);

    if (!this.collection) return;
    try {
      await this.collection.updateOne(
        { email: credential.email },
        { $set: credential },
        { upsert: true },
      );
    } catch (error) {
      console.warn(
        '[Auth] Unable to persist credential:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private async getCredential(email: string): Promise<AuthCredential | null> {
    await this.ensureInitialized();
    return this.credentials.get(normalizeEmail(email)) ?? null;
  }

  async register(
    email: string,
    password: string,
    planId: Plan['id'],
    profileName: string,
    avatarUrl: string,
  ): Promise<User> {
    await this.ensureInitialized();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      throw new AuthError('A valid email address is required.', 400, 'EMAIL_INVALID');
    }
    assertPasswordStrength(password);

    if (this.credentials.has(normalizedEmail) || catalogStore.findUserByEmail(normalizedEmail)) {
      throw new AuthError('An account with this email already exists.', 409, 'EMAIL_IN_USE');
    }

    const user = catalogStore.createUser(normalizedEmail, planId, profileName, avatarUrl);
    await this.saveCredential(this.buildCredential(user, password, 1));
    return user;
  }

  async provisionUser(
    email: string,
    planId: Plan['id'],
    profileName: string,
    avatarUrl: string,
  ): Promise<{ user: User; temporaryPassword: string }> {
    await this.ensureInitialized();
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      throw new AuthError('A valid email address is required.', 400, 'EMAIL_INVALID');
    }
    if (this.credentials.has(normalizedEmail) || catalogStore.findUserByEmail(normalizedEmail)) {
      throw new AuthError('An account with this email already exists.', 409, 'EMAIL_IN_USE');
    }

    const user = catalogStore.createUser(normalizedEmail, planId, profileName, avatarUrl);
    const temporaryPassword = this.generateTemporaryPassword();
    await this.saveCredential(this.buildCredential(user, temporaryPassword, 1));
    return { user, temporaryPassword };
  }

  async authenticate(email: string, password: string): Promise<User> {
    await this.ensureInitialized();
    const normalizedEmail = normalizeEmail(email);
    const credential = this.credentials.get(normalizedEmail);
    const user = catalogStore.findUserByEmail(normalizedEmail);

    if (!credential || !user || !verifyPassword(password, credential.passwordHash)) {
      throw new AuthError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (credential.userId !== user.id) {
      credential.userId = user.id;
      await this.saveCredential(credential);
    }

    return user;
  }

  async issueTokens(user: User): Promise<IssuedTokens> {
    await this.ensureInitialized();
    const credential = this.credentials.get(normalizeEmail(user.email));
    if (!credential) {
      throw new AuthError('No password credential is configured for this account.', 409, 'NO_CREDENTIAL');
    }

    const config = getEnvConfig();
    return {
      accessToken: signToken(user, credential.tokenVersion, 'access'),
      refreshToken: signToken(user, credential.tokenVersion, 'refresh'),
      accessExpiresIn: config.jwtAccessTtlSeconds,
      refreshExpiresIn: config.jwtRefreshTtlSeconds,
    };
  }

  async getUserFromAccessToken(token: string): Promise<User | null> {
    const payload = verifyToken(token, 'access');
    if (!payload) return null;
    return this.resolvePayload(payload.sub, payload.email, payload.ver);
  }

  async getUserFromRefreshToken(token: string): Promise<User | null> {
    const payload = verifyToken(token, 'refresh');
    if (!payload) return null;
    return this.resolvePayload(payload.sub, payload.email, payload.ver);
  }

  private async resolvePayload(
    userId: string,
    email: string,
    tokenVersion: number,
  ): Promise<User | null> {
    await this.ensureInitialized();
    const credential = this.credentials.get(normalizeEmail(email));
    if (!credential) return null;
    if (credential.userId !== userId || credential.tokenVersion !== tokenVersion) return null;
    return catalogStore.findUserById(userId) ?? catalogStore.findUserByEmail(email);
  }

  async changePassword(user: User, currentPassword: string, newPassword: string): Promise<void> {
    await this.ensureInitialized();
    assertPasswordStrength(newPassword);
    if (currentPassword === newPassword) {
      throw new AuthError(
        'The new password must be different from the current password.',
        400,
        'PASSWORD_REUSED',
      );
    }

    const credential = this.credentials.get(normalizeEmail(user.email));
    if (!credential || !verifyPassword(currentPassword, credential.passwordHash)) {
      throw new AuthError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
    }

    credential.passwordHash = hashPassword(newPassword);
    credential.tokenVersion += 1;
    credential.resetTokenHash = undefined;
    credential.resetTokenExpiresAt = undefined;
    await this.saveCredential(credential);
  }

  async createPasswordReset(email: string): Promise<string | null> {
    await this.ensureInitialized();
    const user = catalogStore.findUserByEmail(email);
    if (!user) return null;

    const credential = this.credentials.get(normalizeEmail(email));
    if (!credential) return null;

    const token = randomBytes(32).toString('hex');
    credential.resetTokenHash = hashResetToken(token);
    credential.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await this.saveCredential(credential);
    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    await this.ensureInitialized();
    assertPasswordStrength(newPassword);
    const tokenHash = hashResetToken(token);
    const credential = Array.from(this.credentials.values()).find(
      (entry) => entry.resetTokenHash === tokenHash,
    );

    if (
      !credential ||
      !credential.resetTokenExpiresAt ||
      new Date(credential.resetTokenExpiresAt).getTime() < Date.now()
    ) {
      throw new AuthError('Reset token is invalid or has expired.', 400, 'RESET_TOKEN_INVALID');
    }

    const user = catalogStore.findUserByEmail(credential.email);
    if (!user) throw new AuthError('User not found.', 404, 'USER_NOT_FOUND');

    credential.passwordHash = hashPassword(newPassword);
    credential.tokenVersion += 1;
    credential.resetTokenHash = undefined;
    credential.resetTokenExpiresAt = undefined;
    await this.saveCredential(credential);
    return user;
  }

  async adminResetPassword(email: string): Promise<string> {
    await this.ensureInitialized();
    const user = catalogStore.findUserByEmail(email);
    if (!user) throw new AuthError('User not found.', 404, 'USER_NOT_FOUND');

    const temporaryPassword = this.generateTemporaryPassword();
    const existing = this.credentials.get(normalizeEmail(email));
    if (existing) {
      existing.passwordHash = hashPassword(temporaryPassword);
      existing.tokenVersion += 1;
      existing.resetTokenHash = undefined;
      existing.resetTokenExpiresAt = undefined;
      await this.saveCredential(existing);
    } else {
      await this.saveCredential(this.buildCredential(user, temporaryPassword, 1));
    }
    return temporaryPassword;
  }

  async deleteCredential(email: string): Promise<void> {
    await this.ensureInitialized();
    const normalizedEmail = normalizeEmail(email);
    this.credentials.delete(normalizedEmail);
    if (this.collection) {
      await this.collection.deleteOne({ email: normalizedEmail }).catch(() => undefined);
    }
  }

  private generateTemporaryPassword(): string {
    return `Sf!${randomBytes(12).toString('base64url')}9a`;
  }

  getStatus(): { backend: 'mongodb' | 'memory'; credentials: number } {
    return {
      backend: this.collection ? 'mongodb' : 'memory',
      credentials: this.credentials.size,
    };
  }
}

export const authService = new AuthService();
