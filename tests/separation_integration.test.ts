import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { createServerApp as createBackendApp } from '../sf_backend/app';
import { createServerApp as createRootApp } from '../server';

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe('Separated Architecture & Cross-Service Integration', () => {
  const backendApp = createBackendApp();
  const unifiedApp = createRootApp();
  const agent = request.agent(backendApp);
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@streamflix.local').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || 'StreamFlixSuperAdmin2026!';

  beforeAll(async () => {
    const login = await agent
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });
    expect(login.status).toBe(200);
  });

  it('keeps sf_backend 100% decoupled with zero imports from sf_frontend', () => {
    const backendFiles = collectTsFiles(path.resolve(process.cwd(), 'sf_backend'));
    expect(backendFiles.length).toBeGreaterThan(10);

    for (const file of backendFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/sf_frontend/);
      expect(content).not.toMatch(/src\/lib\/api/);
    }
  });

  it('keeps sf_frontend 100% decoupled with zero direct imports from sf_backend', () => {
    const frontendFiles = collectTsFiles(path.resolve(process.cwd(), 'sf_frontend'));
    expect(frontendFiles.length).toBeGreaterThan(20);

    for (const file of frontendFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/sf_backend/);
      expect(content).not.toMatch(/src\/server/);
    }
  });

  it('mounts modular API routes identically on standalone sf_backend and unified root server', async () => {
    const [bHealth, uHealth] = await Promise.all([
      request(backendApp).get('/api/health'),
      request(unifiedApp).get('/api/health'),
    ]);

    expect(bHealth.status).toBe(200);
    expect(uHealth.status).toBe(200);
    expect(bHealth.body.service).toBe('sf_backend');
    expect(uHealth.body.status).toBe('healthy');
  });

  it('serves all core catalog, billing, podcast, availability, user & streaming routes', async () => {
    const [titlesRes, billboardRes, plansRes, podRes, availRes] = await Promise.all([
      request(backendApp).get('/api/titles'),
      request(backendApp).get('/api/titles/billboard'),
      request(backendApp).get('/api/billing/plans'),
      request(backendApp).get('/api/podcasts'),
      request(backendApp).get('/api/availability/tmdb-movie-27205'),
    ]);

    expect(titlesRes.status).toBe(200);
    expect(titlesRes.body.data.length).toBeGreaterThan(0);

    expect(billboardRes.status).toBe(200);
    expect(billboardRes.body.data?.title).toBeDefined();

    expect(plansRes.status).toBe(200);
    expect(plansRes.body.data.length).toBe(3);

    expect(podRes.status).toBe(200);
    expect(podRes.body.data.length).toBeGreaterThan(0);

    expect(availRes.status).toBe(200);
    expect(availRes.body.data.titleId).toBe('tmdb-movie-27205');
  });

  it('supports user my-list toggle, ratings, and watch progress heartbeat with idempotency', async () => {
    const key = `sep-test-mylist-${Date.now()}`;
    const toggle1 = await agent
      .post('/api/users/my-list/toggle')
      .set('Idempotency-Key', key)
      .send({ titleId: 'tmdb-movie-27205' });

    expect(toggle1.status).toBe(200);
    expect(toggle1.body.success).toBe(true);

    const toggleReplay = await agent
      .post('/api/users/my-list/toggle')
      .set('Idempotency-Key', key)
      .send({ titleId: 'tmdb-movie-27205' });

    expect(toggleReplay.status).toBe(200);
    expect(toggleReplay.headers['x-idempotent-replay']).toBe('true');

    // Toggle back cleanly without key so default fixture stays unchanged
    await agent
      .post('/api/users/my-list/toggle')
      .send({ titleId: 'tmdb-movie-27205' });

    const rateRes = await agent
      .post('/api/users/rate')
      .send({ titleId: 'tmdb-movie-693134', rating: 'like' });
    expect(rateRes.status).toBe(200);
    expect(rateRes.body.likedTitles).toContain('tmdb-movie-693134');

    const progressRes = await agent
      .put('/api/stream/progress')
      .send({ titleId: 'tmdb-movie-27205', progressPercent: 60, seconds: 5200, totalSeconds: 8880 });
    expect(progressRes.status).toBe(200);
    expect(progressRes.body.success).toBe(true);
  });
});
