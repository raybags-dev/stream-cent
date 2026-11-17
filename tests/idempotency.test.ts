import { describe, it, expect } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { idempotencyMiddleware } from '../sf_backend/middleware/idempotency';

describe('Idempotency Middleware', () => {
  const app = express();
  app.use(express.json());
  app.use(idempotencyMiddleware);

  let counter = 0;
  app.post('/test/idempotent-action', (req: Request, res: Response) => {
    counter += 1;
    res.status(201).json({
      success: true,
      executionCount: counter,
      data: req.body,
    });
  });

  it('bypasses caching when Idempotency-Key header is absent', async () => {
    const res1 = await request(app)
      .post('/test/idempotent-action')
      .send({ value: 'alpha' });
    const res2 = await request(app)
      .post('/test/idempotent-action')
      .send({ value: 'alpha' });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.executionCount).not.toBe(res2.body.executionCount);
    expect(res2.headers['x-idempotent-replay']).toBeUndefined();
  });

  it('caches response and returns replay on duplicate Idempotency-Key', async () => {
    const key = `test-key-${Date.now()}`;

    const res1 = await request(app)
      .post('/test/idempotent-action')
      .set('Idempotency-Key', key)
      .send({ value: 'beta' });

    expect(res1.status).toBe(201);
    const firstExecCount = res1.body.executionCount;

    const res2 = await request(app)
      .post('/test/idempotent-action')
      .set('Idempotency-Key', key)
      .send({ value: 'beta' });

    expect(res2.status).toBe(201);
    expect(res2.headers['x-idempotent-replay']).toBe('true');
    expect(res2.body.executionCount).toBe(firstExecCount);
  });

  it('supports X-Idempotency-Key header variant', async () => {
    const key = `test-xkey-${Date.now()}`;

    const res1 = await request(app)
      .post('/test/idempotent-action')
      .set('X-Idempotency-Key', key)
      .send({ value: 'gamma' });

    const res2 = await request(app)
      .post('/test/idempotent-action')
      .set('X-Idempotency-Key', key)
      .send({ value: 'gamma' });

    expect(res2.headers['x-idempotent-replay']).toBe('true');
    expect(res2.body.executionCount).toBe(res1.body.executionCount);
  });
});
