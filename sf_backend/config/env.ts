export interface EnvConfig {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  backendPort: number;
  frontendPort: number;
  clientUrl: string;
  corsOrigins: string[];
  trustProxy: number | boolean;
  cookieSecure: boolean;
  mongoUri: string;
  redisUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtPlaybackSecret: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  playbackTtlSeconds: number;
  adminEmail: string;
  adminSecretKey: string;
  adminPortalPath: string;
  defaultCountry: string;
  tmdbApiKey: string;
  tmdbApiToken: string;
  tvmazeBaseUrl: string;
  watchmodeApiToken: string;
  watchmodeBaseUrl: string;
  movieOfTheNightApiToken: string;
  movieOfTheNightBaseUrl: string;
  resendApiKey: string;
  resendFromEmail: string;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];
  return Array.from(
    new Set(
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  );
}

export function getEnvConfig(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const trustProxyRaw = process.env.TRUST_PROXY?.trim();
  const trustProxy: number | boolean =
    trustProxyRaw === 'true'
      ? 1
      : trustProxyRaw === 'false'
      ? false
      : trustProxyRaw && Number.isFinite(parseInt(trustProxyRaw, 10))
      ? parseInt(trustProxyRaw, 10)
      : isProduction
      ? 1
      : false;

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    backendPort: process.env.BACKEND_PORT
      ? parseInt(process.env.BACKEND_PORT, 10)
      : process.env.PORT
      ? parseInt(process.env.PORT, 10)
      : 3100,
    frontendPort: process.env.FRONTEND_PORT ? parseInt(process.env.FRONTEND_PORT, 10) : 3000,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
    trustProxy,
    cookieSecure:
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === 'true'
        : isProduction,
    mongoUri: process.env.MONGO_URI || '',
    redisUrl: process.env.REDIS_URL?.trim() || '',
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET?.trim() || '',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET?.trim() || '',
    jwtPlaybackSecret: process.env.JWT_PLAYBACK_SECRET?.trim() || '',
    jwtAccessTtlSeconds: parsePositiveInt(process.env.JWT_ACCESS_TTL_SECONDS, 900),
    jwtRefreshTtlSeconds: parsePositiveInt(process.env.JWT_REFRESH_TTL_SECONDS, 604_800),
    playbackTtlSeconds: parsePositiveInt(process.env.PLAYBACK_TTL_SECONDS, 300),
    adminEmail: (process.env.ADMIN_EMAIL || 'admin@streamflix.local').toLowerCase(),
    adminSecretKey: process.env.ADMIN_SECRET_KEY || 'super_admin_secret_token_streamflix_2026',
    adminPortalPath: process.env.ADMIN_PORTAL_PATH || '/control-portal',
    defaultCountry: process.env.AVAILABILITY_DEFAULT_COUNTRY || 'nl',
    tmdbApiKey: process.env.TMDB_API_KEY || '',
    tmdbApiToken: process.env.TMDB_API_TOKEN || '',
    tvmazeBaseUrl: process.env.TVMAZE_BASE_URL || 'https://api.tvmaze.com',
    watchmodeApiToken: process.env.WATCHMODE_API_TOKEN || '',
    watchmodeBaseUrl: process.env.WATCHMODE_BASE_URL || 'https://api.watchmode.com/v1',
    movieOfTheNightApiToken: process.env.MOVIEOFTHENIGHT_API_TOKEN || '',
    movieOfTheNightBaseUrl:
      process.env.MOVIEOFTHENIGHT_BASE_URL || 'https://streaming-availability.p.rapidapi.com/v4',
    resendApiKey: process.env.RESEND_API_KEY || '',
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  };
}
