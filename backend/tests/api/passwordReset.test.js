import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { outbox } from '../../src/lib/mailer.js';
import { resetDatabase, queryDb, CUSTOMER_EMAIL } from '../helpers.js';

beforeEach(async () => {
  await resetDatabase();
  // Empty the test "mailbox" before each test.
  outbox.length = 0;
});

afterAll(async () => {
  await pool.end();
});

function askForLink(email) {
  return request(app).post('/api/auth/forgot-password').send({ email: email });
}

// The token is the ?token=... part of the link in the email.
function tokenFrom(email) {
  return new URL(email.link).searchParams.get('token');
}

function reset(token, password) {
  return request(app).post('/api/auth/reset-password').send({ token: token, password: password });
}

function login(password) {
  return request(app).post('/api/auth/login').send({ email: CUSTOMER_EMAIL, password: password });
}

describe('POST /api/auth/forgot-password', () => {
  it('sends a reset link to an existing account', async () => {
    const response = await askForLink(CUSTOMER_EMAIL);

    expect(response.status).toBe(200);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe(CUSTOMER_EMAIL);
    expect(outbox[0].link).toContain('/reset-password?token=');
  });

  it('gives the same answer for an unknown email and sends nothing', async () => {
    const known = await askForLink(CUSTOMER_EMAIL);
    const unknown = await askForLink('nobody@example.test');

    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual(known.body);
    expect(outbox).toHaveLength(1);
  });

  it('stores only a hash of the token, not the token itself', async () => {
    await askForLink(CUSTOMER_EMAIL);
    const rows = await queryDb('SELECT token_hash FROM password_reset_tokens');

    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(tokenFrom(outbox[0]));
  });

  it('answers 400 for something that is not an email', async () => {
    const response = await askForLink('not-an-email');

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password', () => {
  it('sets the new password: the new one works and the old one does not', async () => {
    await askForLink(CUSTOMER_EMAIL);
    const response = await reset(tokenFrom(outbox[0]), 'brand-new-pass-1');

    expect(response.status).toBe(200);
    expect((await login('brand-new-pass-1')).status).toBe(200);
    expect((await login('Password123!')).status).toBe(401);
  });

  it('lets a link work only once', async () => {
    await askForLink(CUSTOMER_EMAIL);
    const token = tokenFrom(outbox[0]);
    await reset(token, 'brand-new-pass-1');

    const second = await reset(token, 'another-pass-2');

    expect(second.status).toBe(400);
    expect(second.body.error.code).toBe('INVALID_RESET_LINK');
    expect((await login('brand-new-pass-1')).status).toBe(200);
  });

  it('refuses an expired link and keeps the old password', async () => {
    await askForLink(CUSTOMER_EMAIL);
    await queryDb("UPDATE password_reset_tokens SET expires_at = NOW() - INTERVAL '1 minute'");

    const response = await reset(tokenFrom(outbox[0]), 'brand-new-pass-1');

    expect(response.status).toBe(400);
    expect((await login('Password123!')).status).toBe(200);
  });

  it('switches off an older link when a new one is asked for', async () => {
    await askForLink(CUSTOMER_EMAIL);
    await askForLink(CUSTOMER_EMAIL);

    const old = await reset(tokenFrom(outbox[0]), 'brand-new-pass-1');
    const fresh = await reset(tokenFrom(outbox[1]), 'brand-new-pass-1');

    expect(old.status).toBe(400);
    expect(fresh.status).toBe(200);
  });

  it('refuses a made-up token', async () => {
    const response = await reset('a'.repeat(64), 'brand-new-pass-1');

    expect(response.status).toBe(400);
  });

  it('refuses a short password and leaves the link usable', async () => {
    await askForLink(CUSTOMER_EMAIL);
    const token = tokenFrom(outbox[0]);

    const tooShort = await reset(token, '123');
    const good = await reset(token, 'brand-new-pass-1');

    expect(tooShort.status).toBe(400);
    expect(tooShort.body.error.code).toBe('VALIDATION_ERROR');
    expect(good.status).toBe(200);
  });

  it('writes an audit row', async () => {
    await askForLink(CUSTOMER_EMAIL);
    await reset(tokenFrom(outbox[0]), 'brand-new-pass-1');

    const rows = await queryDb("SELECT action FROM audit_log WHERE action = 'user.password_reset'");
    expect(rows).toHaveLength(1);
  });
});
