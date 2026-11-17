import 'dotenv/config';
import { createServerApp } from './app';
import { getEnvConfig } from './config/env';
import { initializeBackend, registerShutdownHandlers } from './bootstrap';

export async function startBackendServer() {
  await initializeBackend();

  const app = createServerApp();
  const { backendPort, nodeEnv } = getEnvConfig();

  const server = app.listen(backendPort, '0.0.0.0', () => {
    console.log(
      `[Stream Flix sf_backend] Standalone API service listening in ${nodeEnv} mode on http://0.0.0.0:${backendPort}`,
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
  startBackendServer().catch((err) => {
    console.error('[Stream Flix sf_backend] Fatal backend startup error:', err);
    process.exit(1);
  });
}
