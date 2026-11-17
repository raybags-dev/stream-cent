import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServerApp, getCurrentUser } from './sf_backend/app';
import {
  initializeBackend,
  registerShutdownHandlers,
} from './sf_backend/bootstrap';

export { createServerApp, getCurrentUser };

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export async function startServer() {
  await initializeBackend();

  const app = createServerApp();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDirectory = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDirectory));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({
          success: false,
          error: { message: 'API route not found.' },
        });
      }
      return res.sendFile(path.resolve(distDirectory, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Stream Flix] Unified Server running in ${process.env.NODE_ENV || 'development'} mode on http://0.0.0.0:${PORT}`,
    );
  });

  registerShutdownHandlers(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  );

  return server;
}

if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[Stream Flix] Fatal server startup error:', err);
    process.exit(1);
  });
}
