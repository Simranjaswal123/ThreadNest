import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, CUSTOMER_EMAIL, ADMIN_EMAIL } from '../helpers.js';

let customer;
let admin;

const validAddress = {
  full_name: 'Demo Customer',
  line1: '12 Market Road',
  city: 'Pune',
  postal_code: '411001',
  country: 'India',
};

beforeAll(async () => {
  await resetDatabase();
  customer = await loginAs(app, CUSTOMER_EMAIL);
  admin = await loginAs(app, ADMIN_EMAIL);
});

afterAll(async () => {
  await pool.end();
});

describe('addresses', () => {
  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).get('/api/addresses');

    expect(response.status).toBe(401);
  });

  it('saves an address and lists it', async () => {
    const created = await customer.post('/api/addresses').send(validAddress);
    const list = await customer.get('/api/addresses');

    expect(created.status).toBe(201);
    expect(created.body.address.line2).toBeNull();
    expect(list.body.addresses).toHaveLength(1);
  });

  it('answers 400 when a required field is missing', async () => {
    const response = await customer.post('/api/addresses').send({ full_name: 'No Street' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('shows only the addresses of the logged in user', async () => {
    const response = await admin.get('/api/addresses');

    expect(response.body.addresses).toEqual([]);
  });

  it('answers 404 when deleting another user\'s address', async () => {
    const list = await customer.get('/api/addresses');
    const response = await admin.delete('/api/addresses/' + list.body.addresses[0].id);

    expect(response.status).toBe(404);
  });

  it('deletes an own address', async () => {
    const list = await customer.get('/api/addresses');
    const response = await customer.delete('/api/addresses/' + list.body.addresses[0].id);
    const after = await customer.get('/api/addresses');

    expect(response.status).toBe(200);
    expect(after.body.addresses).toEqual([]);
  });
});
