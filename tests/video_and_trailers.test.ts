import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import {
  extractYoutubeId,
  isDeadVideoUrl,
  isDirectVideoUrl,
  resolvePlayableDirectVideo,
  getNextFallbackVideo,
  VERIFIED_FALLBACK_VIDEOS,
} from '../sf_frontend/lib/utils/video';
import { TmdbService } from '../sf_backend/integrations/tmdb.service';
import { sanitizeTitleMediaUrls } from '../sf_backend/db/mongo.storage';
import { createServerApp } from '../sf_backend/app';

describe('Video Utilities, Trailer Playback & Config Regression Suite', () => {
  const app = createServerApp();
  const originalTmdbKey = process.env.TMDB_API_KEY;

  afterEach(() => {
    process.env.TMDB_API_KEY = originalTmdbKey;
  });

  it('extracts YouTube video IDs accurately across URL variants', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=YoHD9XEInc0')).toBe('YoHD9XEInc0');
    expect(extractYoutubeId('https://youtu.be/Way9Dexny3w')).toBe('Way9Dexny3w');
    expect(extractYoutubeId('https://www.youtube-nocookie.com/embed/U2Qp5pL3ovA?autoplay=1')).toBe('U2Qp5pL3ovA');
    expect(extractYoutubeId('https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4')).toBeNull();
    expect(extractYoutubeId('')).toBeNull();
  });

  it('rejects dead gtv-videos-bucket URLs and resolves verified playable MP4 streams', () => {
    const deadUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
    expect(isDeadVideoUrl(deadUrl)).toBe(true);
    expect(isDirectVideoUrl(deadUrl)).toBe(false);
    expect(isDeadVideoUrl(VERIFIED_FALLBACK_VIDEOS[0])).toBe(false);
    expect(isDirectVideoUrl(VERIFIED_FALLBACK_VIDEOS[0])).toBe(true);

    const resolved = resolvePlayableDirectVideo(
      deadUrl,
      'https://www.youtube.com/watch?v=YoHD9XEInc0',
      'tmdb-movie-27205'
    );
    expect(VERIFIED_FALLBACK_VIDEOS).toContain(resolved);
    expect(isDeadVideoUrl(resolved)).toBe(false);

    const next = getNextFallbackVideo(VERIFIED_FALLBACK_VIDEOS[0]);
    expect(next).toBe(VERIFIED_FALLBACK_VIDEOS[1]);
    expect(getNextFallbackVideo(VERIFIED_FALLBACK_VIDEOS[VERIFIED_FALLBACK_VIDEOS.length - 1])).toBeNull();
  });

  it('reads TMDB credentials dynamically even if imported before dotenv runs', () => {
    delete process.env.TMDB_API_KEY;
    const svc = new TmdbService();
    const hadToken = Boolean(process.env.TMDB_API_TOKEN);
    if (!hadToken) {
      expect(svc.isConfigured()).toBe(false);
    }
    process.env.TMDB_API_KEY = 'dynamic-runtime-test-key';
    expect(svc.isConfigured()).toBe(true);
  });

  it('sanitizes legacy dead video URLs cleanly without mutating cache', () => {
    const deadStream = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const sanitized = sanitizeTitleMediaUrls({
      id: 'custom-sanitize-test-1',
      title: 'Sanitization Probe',
      type: 'movie',
      tagline: 'Verified streams only',
      synopsis: 'Verifies automatic stream sanitization.',
      releaseYear: 2026,
      maturityRating: 'PG-13',
      matchScore: 98,
      durationMinutes: 95,
      genres: ['Sci-Fi'],
      backdropUrl: 'https://image.tmdb.org/t/p/original/test.jpg',
      posterUrl: 'https://image.tmdb.org/t/p/w780/test.jpg',
      trailerVideoUrl: deadStream,
      videoStreamUrl: deadStream,
      qualities: ['4K Ultra HD'],
      cast: [{ id: 'c1', name: 'Test Actor', role: 'Lead', character: 'Lead' }],
      directors: ['Test Director'],
      audioLanguages: ['English'],
      subtitleLanguages: ['English'],
    });

    expect(sanitized.videoStreamUrl).not.toContain('commondatastorage');
    expect(sanitized.trailerVideoUrl).not.toContain('commondatastorage');
    expect(sanitized.trailerUrl).not.toContain('commondatastorage');
    expect(VERIFIED_FALLBACK_VIDEOS).toContain(sanitized.videoStreamUrl);
  });

  it('serves API catalog endpoints with zero dead commondatastorage stream URLs', async () => {
    const [titlesRes, billboardRes, detailRes] = await Promise.all([
      request(app).get('/api/titles'),
      request(app).get('/api/titles/billboard'),
      request(app).get('/api/titles/tmdb-movie-27205'),
    ]);

    expect(titlesRes.status).toBe(200);
    expect(titlesRes.body.data.length).toBeGreaterThan(0);

    for (const item of titlesRes.body.data) {
      expect(item.videoStreamUrl || '').not.toContain('commondatastorage');
      expect(item.trailerVideoUrl || '').not.toContain('commondatastorage');
      expect(item.trailerUrl || '').not.toContain('commondatastorage');
    }

    expect(billboardRes.status).toBe(200);
    expect(billboardRes.body.data.videoStreamUrl || '').not.toContain('commondatastorage');

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.trailerVideoUrl).toBeDefined();
    expect(detailRes.body.data.trailerVideoUrl).not.toContain('commondatastorage');
  });

  it('renders real controller-free video/iframe previews in PosterCard, Hero trailer-completion cycling in BackdropHero, and clean modal embeds without playlist HUD', () => {
    const posterCard = fs.readFileSync(
      path.resolve(process.cwd(), 'sf_frontend/components/media/PosterCard.tsx'),
      'utf8'
    );
    expect(posterCard).toContain('<video');
    expect(posterCard).toContain('<iframe');
    expect(posterCard).toContain('getNextFallbackVideo');
    expect(posterCard).toContain('disablePictureInPicture');
    expect(posterCard).toContain('controls=0');
    expect(posterCard).toContain('disablekb=1');
    expect(posterCard).toContain('pointer-events-none');
    expect(posterCard).not.toContain('sampleProgress');
    expect(posterCard).not.toMatch(/[?&]playlist=/);
    expect(posterCard).not.toContain('ChevronDown');

    const hero = fs.readFileSync(
      path.resolve(process.cwd(), 'sf_frontend/components/media/BackdropHero.tsx'),
      'utf8'
    );
    expect(hero).not.toMatch(/[?&]playlist=/);
    expect(hero).not.toContain('Previous featured movie');
    expect(hero).not.toContain('Next featured movie');
    expect(hero).not.toContain('ChevronLeft');
    expect(hero).not.toContain('ChevronRight');
    expect(hero).not.toContain('Jump to slide');
    expect(hero).toContain('disablePictureInPicture');
    expect(hero).toContain('disablekb=1');
    expect(hero).toContain('onEnded');
    expect(hero).toContain('shouldUseStandardTimer');
    expect(hero).toContain('state === 0');
    expect(hero).toContain('goToNext');

    const modal = fs.readFileSync(
      path.resolve(process.cwd(), 'sf_frontend/components/media/TitleDetailModal.tsx'),
      'utf8'
    );
    expect(modal).toMatch(/streamFlixApi\s*\.getTitleById/);
    expect(modal).not.toMatch(/[?&]playlist=/);
    expect(modal).toContain('disablePictureInPicture');
    expect(modal).toContain('disablekb=1');
    expect(modal).toContain('Watch Trailer');
    expect(modal).toContain('OFFICIAL TRAILER');
    expect(modal).toContain('<video');

    const playerShell = fs.readFileSync(
      path.resolve(process.cwd(), 'sf_frontend/components/media/PlayerShell.tsx'),
      'utf8'
    );
    expect(playerShell).not.toContain('commondatastorage.googleapis.com/gtv-videos-bucket');
    expect(playerShell).toContain('initialMode');
    expect(playerShell).toContain('getNextFallbackVideo');

    const viteConfig = fs.readFileSync(path.resolve(process.cwd(), 'vite.config.ts'), 'utf8');
    expect(viteConfig).not.toContain('__dirname');
    expect(viteConfig).toContain('import.meta.dirname');
  });
});
