import { Router, Request, Response } from 'express';
import { resendEmailService } from '../../integrations/resend.service';
import { getCurrentUser } from '../../middleware/auth';
import { getEnvConfig } from '../../config/env';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  readCookie,
  setAuthCookies,
} from '../../auth/cookies';
import {
  AuthError,
  authService,
  isValidEmail,
  normalizeEmail,
} from './auth.service';

const router = Router();

function fail(res: Response, error: unknown): Response {
  if (error instanceof AuthError) {
    return res
      .status(error.statusCode)
      .json({ success: false, error: { code: error.code, message: error.message } });
  }

  console.error(
    '[Auth] Unhandled authentication error:',
    error instanceof Error ? error.message : String(error),
  );
  return res
    .status(500)
    .json({ success: false, error: { message: 'Authentication service unavailable.' } });
}

function readPlanId(value: unknown): 'standard-ads' | 'standard' | 'premium' {
  if (value === 'standard-ads' || value === 'standard' || value === 'premium') return value;
  return 'premium';
}

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const password = req.body?.password;
    const planId = readPlanId(req.body?.planId);
    const profileName =
      typeof req.body?.profileName === 'string' && req.body.profileName.trim()
        ? req.body.profileName.trim().slice(0, 80)
        : 'Primary Profile';
    const avatarUrl =
      typeof req.body?.avatarUrl === 'string' &&
      /^(https?:\/\/|data:image\/)/.test(req.body.avatarUrl.trim())
        ? req.body.avatarUrl.trim().slice(0, 100_000)
        : '';

    if (!isValidEmail(email)) {
      throw new AuthError('A valid email address is required.', 400, 'EMAIL_INVALID');
    }

    const user = await authService.register(email, password, planId, profileName, avatarUrl);
    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens);

    resendEmailService.sendWelcomeEmail(email, profileName).catch((err: unknown) => {
      console.warn(
        '[Resend] Welcome notification deferred:',
        err instanceof Error ? err.message : String(err),
      );
    });

    return res.status(201).json({
      success: true,
      data: { user, accessExpiresIn: tokens.accessExpiresIn },
    });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ''));
    const password = req.body?.password;
    if (!isValidEmail(email) || typeof password !== 'string' || password.length === 0) {
      throw new AuthError('Email and password are required.', 400, 'CREDENTIALS_REQUIRED');
    }

    const user = await authService.authenticate(email, password);
    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens);

    return res.json({
      success: true,
      data: { user, accessExpiresIn: tokens.accessExpiresIn },
    });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in.' } });
    }
    return res.json({ success: true, data: user });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = readCookie(req, REFRESH_COOKIE);
    if (!refreshToken) {
      throw new AuthError('Refresh token is missing.', 401, 'REFRESH_TOKEN_MISSING');
    }

    const user = await authService.getUserFromRefreshToken(refreshToken);
    if (!user) {
      clearAuthCookies(res);
      throw new AuthError('Session has expired. Please sign in again.', 401, 'SESSION_EXPIRED');
    }

    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens);
    return res.json({
      success: true,
      data: { user, accessExpiresIn: tokens.accessExpiresIn },
    });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.post('/auth/logout', (_req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.json({ success: true, message: 'Successfully logged out' });
});

router.post('/auth/change-password', async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      throw new AuthError('You must be signed in to change your password.', 401, 'UNAUTHENTICATED');
    }

    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      throw new AuthError(
        'Current and new password are required.',
        400,
        'PASSWORD_FIELDS_REQUIRED',
      );
    }

    await authService.changePassword(user, currentPassword, newPassword);
    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens);
    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(String(req.body?.email ?? ''));
    if (!isValidEmail(email)) {
      throw new AuthError('A valid email address is required.', 400, 'EMAIL_INVALID');
    }

    const resetToken = await authService.createPasswordReset(email);
    const config = getEnvConfig();
    const responseData =
      !config.isProduction && resetToken ? { resetToken } : undefined;

    return res.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.',
      data: responseData,
    });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

router.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const newPassword = req.body?.newPassword;
    if (!token || typeof newPassword !== 'string') {
      throw new AuthError('Reset token and new password are required.', 400, 'RESET_FIELDS_REQUIRED');
    }

    const user = await authService.resetPassword(token, newPassword);
    const tokens = await authService.issueTokens(user);
    setAuthCookies(res, tokens);
    return res.json({
      success: true,
      message: 'Password reset successfully.',
      data: { user },
    });
  } catch (error: unknown) {
    return fail(res, error);
  }
});

export default router;
