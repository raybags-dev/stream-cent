import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServerApp } from '../server';

describe('Stream Flix REST API & Admin Controller Suite', () => {
  const app = createServerApp();
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'super_admin_secret_token_streamflix_2026';
  const rootAdminEmail = (process.env.ADMIN_EMAIL || 'admin@streamflix.local').toLowerCase();
  const rootAdminPassword = process.env.ADMIN_PASSWORD?.trim() || 'StreamFlixSuperAdmin2026!';

  // 1. Health & Core API
  it('GET /api/health returns operational status and service configs', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toBeDefined();
  });

  it('GET /api/titles returns valid movie catalog list', async () => {
    const res = await request(app).get('/api/titles');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/titles/billboard returns featured title with trailer video', async () => {
    const res = await request(app).get('/api/titles/billboard');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBeDefined();
  });

  // 2. Admin Controller Status & Maintenance Mode
  it('GET /api/admin/status returns real-time system status and mode', async () => {
    const res = await request(app).get('/api/admin/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.serviceMode).toBeDefined();
  });

  it('POST /api/admin/toggle-live-movies toggles live vs dummy maintenance', async () => {
    const resOff = await request(app)
      .post('/api/admin/toggle-live-movies')
      .send({ enabled: false });
    expect(resOff.status).toBe(200);
    expect(resOff.body.liveMoviesEnabled).toBe(false);
    expect(resOff.body.mode).toBe('DUMMY_MAINTENANCE');

    const resOn = await request(app)
      .post('/api/admin/toggle-live-movies')
      .send({ enabled: true });
    expect(resOn.status).toBe(200);
    expect(resOn.body.liveMoviesEnabled).toBe(true);
    expect(resOn.body.mode).toBe('LIVE_SERVICES');
  });

  // 3. Admin Superuser RBAC & Management (used by ./admin_manager/*.sh)
  it('GET /api/admin/users rejects unauthorized requests without X-Admin-Secret', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/admin/users lists all superusers when valid secret is provided', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('X-Admin-Secret', adminSecret);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((u: any) => u.email === rootAdminEmail)).toBe(true);
  });

  it('POST /api/admin/users/create provisions new admin and dispatches Resend notification', async () => {
    const testAdminEmail = `operator_${Date.now()}@streamflix.local`;
    const idempotencyKey = `idemp-create-${Date.now()}`;

    const res = await request(app)
      .post('/api/admin/users/create')
      .set('X-Admin-Secret', adminSecret)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        email: testAdminEmail,
        role: 'admin',
        profileName: 'Integration Tester',
        planId: 'premium',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testAdminEmail);

    // Test Idempotency Replay
    const replayRes = await request(app)
      .post('/api/admin/users/create')
      .set('X-Admin-Secret', adminSecret)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        email: testAdminEmail,
        role: 'admin',
        profileName: 'Integration Tester',
        planId: 'premium',
      });

    expect(replayRes.status).toBe(201);
    expect(replayRes.headers['x-idempotent-replay']).toBe('true');

    // Clean up created user
    await request(app)
      .post('/api/admin/users/delete')
      .set('X-Admin-Secret', adminSecret)
      .send({ email: testAdminEmail });
  });

  it('POST /api/admin/users/delete forbids deleting primary root superadmin', async () => {
    const res = await request(app)
      .post('/api/admin/users/delete')
      .set('X-Admin-Secret', adminSecret)
      .send({ email: rootAdminEmail });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('primary root superadmin');
  });

  it('POST /api/admin/users/reset-password issues reset token and dispatches email', async () => {
    const resetTargetEmail = `reset_target_${Date.now()}@streamflix.local`;
    const createRes = await request(app)
      .post('/api/admin/users/create')
      .set('X-Admin-Secret', adminSecret)
      .send({ email: resetTargetEmail, role: 'admin', profileName: 'Reset Target', planId: 'premium' });
    expect(createRes.status).toBe(201);

    const res = await request(app)
      .post('/api/admin/users/reset-password')
      .set('X-Admin-Secret', adminSecret)
      .send({ email: resetTargetEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.temporaryPassword).toBeDefined();
    expect(res.body.resetToken).toBeDefined();

    await request(app)
      .post('/api/admin/users/delete')
      .set('X-Admin-Secret', adminSecret)
      .send({ email: resetTargetEmail });
  });

  // 4. User Authentication & Profile
  it('POST /api/auth/login authenticates admin user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: rootAdminEmail, password: rootAdminPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(rootAdminEmail);
    expect(res.body.data.token).toBeUndefined();
    const setCookie = res.headers['set-cookie'];
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    expect(cookies.some((cookie) => cookie.startsWith('sf_access_token='))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('sf_refresh_token='))).toBe(true);
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: rootAdminEmail, password: 'definitely-wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
