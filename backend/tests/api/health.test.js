import request from 'supertest';
import { describe, it, expect, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

afterAll(async () => {
  await pool.end();
});

describe('GET /api/health', () => {
  it('answers ok and says the database is up', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('up');
  });

  it('returns the standard error body for an unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
