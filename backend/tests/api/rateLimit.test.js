import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// The login limit is read from the environment when the app is loaded. So this test sets a
// small limit first and loads the app afterwards (a dynamic import, not a normal one).
let app;
let pool;

beforeAll(async () => {
  process.env.LOGIN_RATE_LIMIT_MAX = '3';
  app = (await import('../../src/app.js')).app;
  pool = (await import('../../src/db/pool.js')).pool;
});

afterAll(async () => {
  await pool.end();
});

describe('login rate limit', () => {
  it('blocks the 4th login attempt with 429 in the standard error format', async () => {
    const attempt = () => request(app).post('/api/auth/login').send({ email: 'someone@example.test', password: 'wrong-password' });

    const first = await attempt();
    const second = await attempt();
    const third = await attempt();
    const fourth = await attempt();

    expect([first.status, second.status, third.status]).toEqual([401, 401, 401]);
    expect(fourth.status).toBe(429);
    expect(fourth.body.error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('does not limit other routes', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
  });
});
