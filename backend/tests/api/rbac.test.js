import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, placeTestOrder, ADMIN_EMAIL, CUSTOMER_EMAIL } from '../helpers.js';

// Rule 4: every admin route is tested as nobody (401), as a customer (403) and as an admin (2xx).

let admin;
let customer;
let orderId;
let routes;

beforeAll(async () => {
  await resetDatabase();
  admin = await loginAs(app, ADMIN_EMAIL);
  customer = await loginAs(app, CUSTOMER_EMAIL);
  const order = await placeTestOrder(customer, 'TN-TSH1-BLK-M', 1);
  orderId = order.id;

  // method, path, body, and the status an admin should get
  routes = [
    ['GET', '/api/admin/categories', undefined, 200],
    ['POST', '/api/admin/categories', { name: 'Scarves' }, 201],
    ['PATCH', '/api/admin/categories/1', { name: 'Tees' }, 200],
    ['GET', '/api/admin/products', undefined, 200],
    ['GET', '/api/admin/products/1', undefined, 200],
    ['POST', '/api/admin/products', { category_id: 1, name: 'RBAC Tee', price_cents: 100, variants: [{ sku: 'TN-RBAC-1', stock_qty: 1 }] }, 201],
    ['PATCH', '/api/admin/products/2', { price_cents: 123 }, 200],
    ['DELETE', '/api/admin/products/3', undefined, 200],
    ['POST', '/api/admin/products/4/variants', { sku: 'TN-RBAC-2', stock_qty: 1 }, 201],
    ['PATCH', '/api/admin/variants/1', { color: 'Jet Black' }, 200],
    ['POST', '/api/admin/variants/1/stock', { delta: 1 }, 200],
    ['GET', '/api/admin/orders', undefined, 200],
    ['GET', '/api/admin/orders/' + orderId, undefined, 200],
    ['PATCH', '/api/admin/orders/' + orderId + '/status', { status: 'cancelled' }, 200],
    ['GET', '/api/admin/customers', undefined, 200],
    ['GET', '/api/admin/reports/summary', undefined, 200],
    ['GET', '/api/admin/audit', undefined, 200],
  ];
});

afterAll(async () => {
  await pool.end();
});

function send(agent, method, path, body) {
  const call = agent[method.toLowerCase()](path);
  return body === undefined ? call : call.send(body);
}

describe('admin routes by role', () => {
  // The list is filled in beforeAll, so we read it inside each test.
  const names = [
    'GET categories', 'POST categories', 'PATCH category', 'GET products', 'GET product',
    'POST product', 'PATCH product', 'DELETE product', 'POST variant', 'PATCH variant',
    'POST stock', 'GET orders', 'GET order', 'PATCH order status', 'GET customers',
    'GET summary', 'GET audit',
  ];

  names.forEach((name, index) => {
    it(name + ': nobody gets 401', async () => {
      const [method, path, body] = routes[index];
      const response = await send(request(app), method, path, body);

      expect(response.status).toBe(401);
    });

    it(name + ': a customer gets 403', async () => {
      const [method, path, body] = routes[index];
      const response = await send(customer, method, path, body);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it(name + ': an admin is allowed', async () => {
      const [method, path, body, expected] = routes[index];
      const response = await send(admin, method, path, body);

      expect(response.status).toBe(expected);
    });
  });

  it('protects admin paths that do not exist yet: 401, 403 and 404', async () => {
    const anonymous = await request(app).get('/api/admin/future-feature');
    const asCustomer = await customer.get('/api/admin/future-feature');
    const asAdmin = await admin.get('/api/admin/future-feature');

    expect([anonymous.status, asCustomer.status, asAdmin.status]).toEqual([401, 403, 404]);
  });

  it('does not let a customer become an admin by sending a role', async () => {
    const response = await customer.patch('/api/me').send({ role: 'admin' });
    const check = await customer.get('/api/admin/customers');

    expect(response.status).toBe(404);
    expect(check.status).toBe(403);
  });
});
