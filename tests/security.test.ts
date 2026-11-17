import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { securityHardeningMiddleware, apiRateLimiter } from '../sf_backend/middleware/security';

describe('Security Hardening & Cyber Defense Middleware', () => {
  const app = express();
  app.use(express.json());
  app.use(securityHardeningMiddleware);

  app.get('/api/test-secure', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'access granted' });
  });

  app.post('/api/test-secure', (req: Request, res: Response) => {
    res.json({ success: true, received: req.body });
  });

  it('attaches defensive security headers to responses', async () => {
    const res = await request(app).get('/api/test-secure');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('detects and rejects prototype pollution vectors in request body', async () => {
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "name": "attacker"}');
    const res = await request(app)
      .post('/api/test-secure')
      .send(maliciousPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('forbidden input parameter');
  });

  it('detects and rejects constructor prototype injection attempts', async () => {
    const maliciousPayload = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
    const res = await request(app)
      .post('/api/test-secure')
      .send(maliciousPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('blocks sensitive path traversal and direct dotfile access', async () => {
    const resDotenv = await request(app).get('/.env');
    expect(resDotenv.status).toBe(403);
    expect(resDotenv.body.success).toBe(false);

    const resTraversal = await request(app).get('/api/../secrets.json');
    expect(resTraversal.status).toBe(403);
  });
});

describe('API Rate Limiter', () => {
  const rateLimitedApp = express();
  rateLimitedApp.use(apiRateLimiter);

  rateLimitedApp.get('/api/rate-limited-endpoint', (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  it('allows normal API requests within threshold', async () => {
    const res = await request(rateLimitedApp).get('/api/rate-limited-endpoint');
    expect(res.status).toBe(200);
  });
});
