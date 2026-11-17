import { Router, Request, Response } from 'express';
import { tmdbService } from '../../integrations/tmdb.service';
import { watchmodeService } from '../../integrations/watchmode.service';
import { movieOfTheNightService } from '../../integrations/movieofthenight.service';
import { getEnvConfig } from '../../config/env';
import { catalogStore } from '../../data/catalog.store';
import { getRedisStatus } from '../../cache/redis.client';
import { authService } from '../auth/auth.service';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const env = getEnvConfig();
  const storage = catalogStore.getStorageStatus();
  res.json({
    success: true,
    status: 'healthy',
    service: 'sf_backend',
    timestamp: new Date().toISOString(),
    storage,
    redis: getRedisStatus(),
    services: {
      auth: authService.getStatus(),
      tmdb: {
        configured: tmdbService.isConfigured(),
        baseUrl: 'https://api.themoviedb.org/3',
      },
      tvmaze: {
        configured: true,
        baseUrl: env.tvmazeBaseUrl,
      },
      watchmode: {
        configured: watchmodeService.isConfigured(),
        baseUrl: env.watchmodeBaseUrl,
      },
      movieOfTheNight: {
        configured: movieOfTheNightService.isConfigured(),
        baseUrl: env.movieOfTheNightBaseUrl,
      },
    },
  });
});

export default router;
