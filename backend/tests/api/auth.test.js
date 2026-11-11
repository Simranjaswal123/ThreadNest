import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, CUSTOMER_EMAIL } from '../helpers.js';

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

const newUser = { email: 'new.person@example.test', password: 'secret-pass-1', full_name: 'New Person' };

describe('POST /api/auth/register', () => {
  it('creates a customer and never returns the password hash', async () => {
    const response = await request(app).post('/api/auth/register').send(newUser);

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(newUser.email);
    expect(response.body.user.role).toBe('customer');
    expect(JSON.stringify(response.body)).not.toContain('password');
  });

  it('answers 409 when the email is already used', async () => {
    const response = await request(app).post('/api/auth/register').send(newUser);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('ignores a role sent in the body', async () => {
    const body = { email: 'sneaky@example.test', password: 'secret-pass-1', full_name: 'Sneaky', role: 'admin' };
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('customer');
  });

  it('answers 400 for a short password', async () => {
    const body = { email: 'short@example.test', password: '123', full_name: 'Short' };
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password and sets an httpOnly cookie', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: newUser.password });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('answers 401 for a wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: 'wrong-password' });

    expect(response.status).toBe(401);
  });

  it('gives the same message for an unknown email as for a wrong password', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: newUser.email, password: 'wrong-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.test', password: 'whatever-1' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });
});

describe('GET /api/me and logout', () => {
  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).get('/api/me');

    expect(response.status).toBe(401);
  });

  it('returns the logged in user', async () => {
    const agent = await loginAs(app, CUSTOMER_EMAIL);
    const response = await agent.get('/api/me');

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(CUSTOMER_EMAIL);
  });

  it('logs out so that /api/me answers 401 again', async () => {
    const agent = await loginAs(app, CUSTOMER_EMAIL);
    await agent.post('/api/auth/logout');
    const response = await agent.get('/api/me');

    expect(response.status).toBe(401);
  });
});
