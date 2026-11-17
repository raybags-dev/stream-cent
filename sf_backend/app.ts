import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { securityHardeningMiddleware, apiRateLimiter } from './middleware/security';
import { idempotencyMiddleware } from './middleware/idempotency';
import apiRoutes from './routes';
import { getEnvConfig } from './config/env';

dotenv.config();

export { getCurrentUser, requireAdminAuth } from './middleware/auth';

function isLocalDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]'
    );
  } catch {
    return false;
  }
}

export function createServerApp() {
  const app = express();
  const config = getEnvConfig();
  const allowedOrigins = new Set(
    [config.clientUrl, ...config.corsOrigins].filter((origin) => origin.length > 0),
  );

  app.set('trust proxy', config.trustProxy);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        // Local development (vite on :3000, backend on :3100) reflects any
        // localhost origin so credentialed cookie auth always works.
        if (!config.isProduction && isLocalDevOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use(securityHardeningMiddleware);
  app.use(apiRateLimiter);
  app.use(idempotencyMiddleware);

  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Expose generated visual assets consistently in both standalone & production deployments
  app.use('/src/assets', express.static(path.resolve(process.cwd(), 'src', 'assets')));

  // Mount all modular backend REST endpoints under /api
  app.use('/api', apiRoutes);

  return app;
}
