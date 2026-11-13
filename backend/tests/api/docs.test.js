import fs from 'node:fs';
import request from 'supertest';
import YAML from 'yaml';
import { describe, it, expect, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

const document = YAML.parse(fs.readFileSync(new URL('../../openapi.yaml', import.meta.url), 'utf8'));

afterAll(async () => {
  await pool.end();
});

// Every endpoint of the app, as "METHOD path". If a route is added, this list and openapi.yaml
// must both be updated, otherwise this test fails.
const endpoints = [
  'get /api/health',
  'post /api/auth/register', 'post /api/auth/login', 'post /api/auth/logout', 'get /api/me',
  'post /api/auth/forgot-password', 'post /api/auth/reset-password',
  'get /api/categories', 'get /api/products', 'get /api/products/{id}',
  'get /api/cart', 'post /api/cart/items', 'patch /api/cart/items/{variantId}', 'delete /api/cart/items/{variantId}',
  'get /api/addresses', 'post /api/addresses', 'delete /api/addresses/{id}',
  'post /api/checkout',
  'get /api/orders', 'get /api/orders/{id}', 'post /api/orders/{id}/pay', 'post /api/orders/{id}/cancel',
  'get /api/admin/categories', 'post /api/admin/categories', 'patch /api/admin/categories/{id}',
  'get /api/admin/products', 'post /api/admin/products',
  'get /api/admin/products/{id}', 'patch /api/admin/products/{id}', 'delete /api/admin/products/{id}',
  'post /api/admin/products/{id}/variants',
  'patch /api/admin/variants/{variantId}', 'post /api/admin/variants/{variantId}/stock',
  'get /api/admin/orders', 'get /api/admin/orders/{id}', 'patch /api/admin/orders/{id}/status',
  'get /api/admin/customers', 'get /api/admin/reports/summary', 'get /api/admin/audit',
];

describe('API documentation', () => {
  it('serves the Swagger page at /api/docs', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });

  it('documents every endpoint', () => {
    for (const endpoint of endpoints) {
      const [method, path] = endpoint.split(' ');
      expect(document.paths[path], 'missing path ' + path).toBeDefined();
      expect(document.paths[path][method], 'missing ' + endpoint).toBeDefined();
    }
  });

  it('documents nothing that does not exist', () => {
    let documented = 0;
    for (const path of Object.keys(document.paths)) {
      documented = documented + Object.keys(document.paths[path]).length;
    }

    expect(documented).toBe(endpoints.length);
  });
});
