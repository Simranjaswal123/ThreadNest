import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, placeTestOrder, ADMIN_EMAIL, CUSTOMER_EMAIL } from '../helpers.js';

let admin;
let customer;
let order;

beforeAll(async () => {
  await resetDatabase(true);
  admin = await loginAs(app, ADMIN_EMAIL);
  customer = await loginAs(app, CUSTOMER_EMAIL);
  order = await placeTestOrder(customer, 'TN-TSH1-BLK-M', 1);
});

afterAll(async () => {
  await pool.end();
});

describe('security headers and CORS', () => {
  it('sets helmet headers and hides that the server runs Express', async () => {
    const response = await request(app).get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('allows the frontend origin to send cookies', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('gives no CORS permission to any other origin', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://evil.example');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('the login cookie', () => {
  it('is httpOnly and sameSite lax', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: CUSTOMER_EMAIL, password: 'Password123!' });
    const cookie = response.headers['set-cookie'][0];

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('is refused when it was changed (a forged token)', async () => {
    const response = await request(app).get('/api/me').set('Cookie', 'token=not.a.real.token');

    expect(response.status).toBe(401);
  });
});

describe('no password hash in any response', () => {
  it('keeps hashes out of every endpoint that returns people or orders', async () => {
    const asAdmin = ['/api/me', '/api/admin/customers', '/api/admin/orders', '/api/admin/audit?limit=50', '/api/admin/orders/' + order.id];
    const asCustomer = ['/api/me', '/api/orders', '/api/orders/' + order.id, '/api/addresses', '/api/cart'];

    const bodies = [];
    for (const path of asAdmin) {
      bodies.push(JSON.stringify((await admin.get(path)).body));
    }
    for (const path of asCustomer) {
      bodies.push(JSON.stringify((await customer.get(path)).body));
    }
    const login = await request(app).post('/api/auth/login').send({ email: CUSTOMER_EMAIL, password: 'Password123!' });
    bodies.push(JSON.stringify(login.body));

    for (const body of bodies) {
      expect(body).not.toContain('password');
      // a bcrypt hash starts with $2a$, $2b$ or $2y$
      expect(body).not.toMatch(/\$2[aby]\$/);
    }
  });
});

describe('ownership (IDOR): other people\'s data looks like it does not exist', () => {
  it('gives 404 for the order, pay and cancel of someone else', async () => {
    const view = await admin.get('/api/orders/' + order.id);
    const pay = await admin.post('/api/orders/' + order.id + '/pay').send({ cardNumber: '4242424242424242' });
    const cancel = await admin.post('/api/orders/' + order.id + '/cancel');

    expect([view.status, pay.status, cancel.status]).toEqual([404, 404, 404]);
  });

  it('gives 404 when using the address of someone else', async () => {
    const addresses = await customer.get('/api/addresses');
    await admin.post('/api/cart/items').send({ variantId: 1, quantity: 1 });
    const response = await admin
      .post('/api/checkout')
      .set('Idempotency-Key', 'idor-test-key-0001')
      .send({ addressId: addresses.body.addresses[0].id });

    expect(response.status).toBe(404);
  });

  it('shows an admin only his own cart, orders and addresses on the customer routes', async () => {
    const orders = await admin.get('/api/orders');
    const addresses = await admin.get('/api/addresses');

    expect(orders.body.orders).toEqual([]);
    expect(addresses.body.addresses).toEqual([]);
  });
});

describe('input checks', () => {
  it('returns 400 and the standard error body for broken JSON', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{ not json');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('refuses a text where a number is expected in the path', async () => {
    const response = await admin.get('/api/admin/orders/abc');

    expect(response.status).toBe(400);
  });
});
