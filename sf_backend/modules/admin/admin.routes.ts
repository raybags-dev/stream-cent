import { Router, Request, Response } from 'express';
import { catalogStore } from '../../data/catalog.store';
import { tmdbService } from '../../integrations/tmdb.service';
import { watchmodeService } from '../../integrations/watchmode.service';
import { movieOfTheNightService } from '../../integrations/movieofthenight.service';
import { resendEmailService } from '../../integrations/resend.service';
import { requireAdminAuth } from '../../middleware/auth';
import { getEnvConfig } from '../../config/env';
import { AuthError, authService } from '../auth/auth.service';
import { getRedisStatus } from '../../cache/redis.client';

const router = Router();

router.get('/admin/status', async (_req: Request, res: Response) => {
  try {
    const isLive = catalogStore.isLiveMoviesEnabled();
    const allTitles = await catalogStore.getTitles({});
    const plans = catalogStore.getPlans();
    const podcasts = catalogStore.getPodcasts();
    const storage = catalogStore.getStorageStatus();

    res.json({
      success: true,
      data: {
        liveMoviesEnabled: isLive,
        serviceMode: isLive ? 'LIVE_SERVICES' : 'DUMMY_MAINTENANCE',
        catalogCount: allTitles.length,
        plansCount: plans.length,
        podcastsCount: podcasts.length,
        services: {
          redis: getRedisStatus(),
          auth: authService.getStatus(),
          tmdb: { configured: tmdbService.isConfigured() },
          tvmaze: { configured: true, status: 'online' },
          watchmode: { configured: watchmodeService.isConfigured() },
          movieOfTheNight: { configured: movieOfTheNightService.isConfigured() },
          mongoDb: {
            status: storage.mongo.connected ? 'connected' : 'unavailable',
            database: storage.mongo.database,
            cachedRecords: storage.movies.cachedRecords,
          },
          s3: {
            status: storage.s3.configured ? 'configured' : 'unconfigured',
            bucket: storage.s3.bucket,
            region: storage.s3.region,
          },
        },
        storage,
        lastSync: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/toggle-live-movies', (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const targetState = typeof enabled === 'boolean' ? enabled : !catalogStore.isLiveMoviesEnabled();
    const updated = catalogStore.setLiveMoviesEnabled(targetState);
    res.json({
      success: true,
      liveMoviesEnabled: updated,
      mode: updated ? 'LIVE_SERVICES' : 'DUMMY_MAINTENANCE',
      message: updated
        ? 'Live movie service activated. Real database & streaming titles are active.'
        : 'Dummy placeholder maintenance mode activated. All views now render maintenance placeholders.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/sync-catalog', async (_req: Request, res: Response) => {
  try {
    await catalogStore.syncRemoteCatalogs();
    res.json({
      success: true,
      message: 'Remote catalogs synced from TVMaze/TMDB into 24-hr persistent cache.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/admin/users', requireAdminAuth, (_req: Request, res: Response) => {
  try {
    const users = catalogStore.getAllUsers();
    const { adminEmail } = getEnvConfig();
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.email.toLowerCase() === adminEmail ? 'superuser' : 'admin',
      planId: u.planId,
      profilesCount: u.profiles.length,
      profiles: u.profiles,
      status: 'active',
    }));
    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/users/create', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { email, role = 'admin', profileName = 'Admin', planId = 'premium' } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: { message: 'Valid email address required' } });
    }

    const existing = catalogStore.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, error: { message: `Account ${email} already exists.` } });
    }

    const { user, temporaryPassword } = await authService.provisionUser(
      email,
      planId,
      profileName,
      '',
    );

    await resendEmailService.sendWelcomeEmail(email, profileName);
    await resendEmailService.sendAdminAlert(
      'New Admin Provisioned',
      `Account ${email} registered with role ${role}.`
    );

    res.status(201).json({
      success: true,
      message: `Admin account for ${email} successfully created.`,
      data: {
        id: user.id,
        email: user.email,
        role,
        planId: user.planId,
        profiles: user.profiles,
        temporaryPassword,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/users/delete', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }

    const { adminEmail } = getEnvConfig();
    if (email.toLowerCase() === adminEmail) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: Cannot delete the primary root superadmin account.' },
      });
    }

    const deleted = catalogStore.deleteUser(email);
    if (!deleted) {
      return res.status(404).json({ success: false, error: { message: `User ${email} not found.` } });
    }
    await authService.deleteCredential(email);

    await resendEmailService.sendAdminAlert(
      'Admin Account Deleted',
      `Admin account ${email} was permanently revoked.`
    );

    res.json({ success: true, message: `Account ${email} has been permanently deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/admin/users/reset-password', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: { message: 'Email is required' } });
    }

    const tempPassword = await authService.adminResetPassword(email);
    const resetToken = await authService.createPasswordReset(email);

    if (resetToken) {
      await resendEmailService.sendPasswordResetEmail(email, resetToken);
    }
    await resendEmailService.sendAdminAlert(
      'Admin Password Reset',
      `Temporary credentials generated and dispatched to ${email}.`
    );

    res.json({
      success: true,
      message: `Temporary password generated and email dispatched to ${email}.`,
      temporaryPassword: tempPassword,
      resetToken,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ success: false, error: { message: err.message } });
    }
    return res.status(500).json({
      success: false,
      error: { message: err instanceof Error ? err.message : 'Unable to reset password.' },
    });
  }
});

export default router;
