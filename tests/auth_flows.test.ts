import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServerApp } from '../server';

const app = createServerApp();

function uniqueEmail(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@streamflix.test`;
}

function expectAuthCookies(res: request.Response): void {
  const setCookie = res.headers['set-cookie'];
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  expect(cookies.some((cookie) => cookie.startsWith('sf_access_token='))).toBe(true);
  expect(cookies.some((cookie) => cookie.startsWith('sf_refresh_token='))).toBe(true);
  expect(
    cookies.every((cookie) => /httponly/i.test(cookie)),
  ).toBe(true);
}

describe('Authentication Flows (cookie + JWT)', () => {
  it('registers a new account, sets httpOnly cookies, and serves /auth/me', async () => {
    const email = uniqueEmail('register');
    const agent = request.agent(app);

    const register = await agent.post('/api/auth/register').send({
      email,
      password: 'Str0ng!Passw0rd',
      planId: 'premium',
      profileName: 'Integration User',
      avatarUrl: '',
    });

    expect(register.status).toBe(201);
    expect(register.body.success).toBe(true);
    expect(register.body.data.user.email).toBe(email);
    expectAuthCookies(register);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
  });

  it('rejects duplicate registration and weak passwords', async () => {
    const email = uniqueEmail('duplicate');
    const agent = request.agent(app);

    const first = await agent
      .post('/api/auth/register')
      .send({ email, password: 'Str0ng!Passw0rd', planId: 'standard', profileName: 'First', avatarUrl: '' });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'An0ther!Pass', planId: 'standard', profileName: 'Second', avatarUrl: '' });
    expect(duplicate.status).toBe(409);

    const weak = await request(app)
      .post('/api/auth/register')
      .send({ email: uniqueEmail('weak'), password: 'short', planId: 'standard', profileName: 'Weak', avatarUrl: '' });
    expect(weak.status).toBe(400);
  });

  it('returns 401 for /auth/me without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('supports password change with token revocation across sessions', async () => {
    const email = uniqueEmail('changepass');
    const password = 'Initial!Pass123';
    const newPassword = 'Updated!Pass456';

    const sessionOne = request.agent(app);
    await sessionOne
      .post('/api/auth/register')
      .send({ email, password, planId: 'premium', profileName: 'Changer', avatarUrl: '' })
      .expect(201);

    const sessionTwo = request.agent(app);
    const secondLogin = await sessionTwo
      .post('/api/auth/login')
      .send({ email, password });
    expect(secondLogin.status).toBe(200);

    const change = await sessionOne
      .post('/api/auth/change-password')
      .send({ currentPassword: password, newPassword });
    expect(change.status).toBe(200);
    expectAuthCookies(change);

    const revoked = await sessionTwo.get('/api/auth/me');
    expect(revoked.status).toBe(401);

    const oldPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });
    expect(newPasswordLogin.status).toBe(200);
    expectAuthCookies(newPasswordLogin);
  });

  it('clears the session on logout', async () => {
    const email = uniqueEmail('logout');
    const agent = request.agent(app);
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'Logout!Pass123', planId: 'standard', profileName: 'Logout', avatarUrl: '' })
      .expect(201);

    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });

  it('issues a reset token (non-production) and resets the password', async () => {
    const email = uniqueEmail('reset');
    const password = 'Reset!Start123';
    const newPassword = 'Reset!Finish456';

    const agent = request.agent(app);
    await agent
      .post('/api/auth/register')
      .send({ email, password, planId: 'standard', profileName: 'Reset', avatarUrl: '' })
      .expect(201);

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email });
    expect(forgot.status).toBe(200);
    expect(forgot.body.data?.resetToken).toBeDefined();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: forgot.body.data.resetToken, newPassword });
    expect(reset.status).toBe(200);
    expectAuthCookies(reset);

    const oldLogin = await request(app).post('/api/auth/login').send({ email, password });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });
    expect(newLogin.status).toBe(200);
  });

  it('does not leak account existence from forgot-password for unknown emails', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: uniqueEmail('ghost') });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeUndefined();
  });

  it('rotates the session via /auth/refresh', async () => {
    const email = uniqueEmail('refresh');
    const agent = request.agent(app);
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'Refresh!Pass123', planId: 'standard', profileName: 'Refresh', avatarUrl: '' })
      .expect(201);

    const refreshed = await agent.post('/api/auth/refresh');
    expect(refreshed.status).toBe(200);
    expectAuthCookies(refreshed);

    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
  });
});
