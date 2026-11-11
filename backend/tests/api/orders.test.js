import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, registerCustomer, placeTestOrder, CUSTOMER_EMAIL } from '../helpers.js';

let customer;
let stranger;
let firstOrder;
let secondOrder;

beforeAll(async () => {
  await resetDatabase();
  customer = await loginAs(app, CUSTOMER_EMAIL);
  firstOrder = await placeTestOrder(customer, 'TN-TSH1-BLK-M', 1);
  secondOrder = await placeTestOrder(customer, 'TN-SOC1-WHT', 2);
  stranger = await registerCustomer(app, 'stranger@example.test');
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/orders', () => {
  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).get('/api/orders');

    expect(response.status).toBe(401);
  });

  it('lists own orders, newest first', async () => {
    const response = await customer.get('/api/orders');

    expect(response.status).toBe(200);
    expect(response.body.orders.map((order) => order.id)).toEqual([secondOrder.id, firstOrder.id]);
    expect(response.body.orders[0].item_count).toBe(2);
  });

  it('does not list the orders of other users', async () => {
    const response = await stranger.get('/api/orders');

    expect(response.body.orders).toEqual([]);
  });
});

describe('GET /api/orders/:id', () => {
  it('returns the order with items, payments and history', async () => {
    const response = await customer.get('/api/orders/' + firstOrder.id);

    expect(response.status).toBe(200);
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.payments).toEqual([]);
    expect(response.body.order.history).toHaveLength(1);
  });

  it('answers 404 for the order of another user', async () => {
    const response = await stranger.get('/api/orders/' + firstOrder.id);

    expect(response.status).toBe(404);
  });

  it('answers 404 for an order that does not exist', async () => {
    const response = await customer.get('/api/orders/99999');

    expect(response.status).toBe(404);
  });

  it('never returns a password hash', async () => {
    const response = await customer.get('/api/orders/' + firstOrder.id);

    expect(JSON.stringify(response.body)).not.toContain('password');
  });
});
