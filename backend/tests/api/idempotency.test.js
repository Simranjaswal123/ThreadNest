import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import {
  resetDatabase, loginAs, registerCustomer, createAddress, addToCart, checkout,
  getStock, queryDb, CUSTOMER_EMAIL,
} from '../helpers.js';

// Rule 2: sending the same checkout again must not create a second order.

const SKU = 'TN-TSH1-BLK-M';
const KEY = 'test-idempotency-key-1';

let customer;
let addressId;

beforeEach(async () => {
  await resetDatabase();
  customer = await loginAs(app, CUSTOMER_EMAIL);
  await addToCart(customer, SKU, 2);
  addressId = await createAddress(customer);
});

afterAll(async () => {
  await pool.end();
});

describe('idempotent checkout', () => {
  it('creates one order for five identical requests at the same moment', async () => {
    const stockBefore = await getStock(SKU);

    const responses = await Promise.all([
      checkout(customer, addressId, KEY),
      checkout(customer, addressId, KEY),
      checkout(customer, addressId, KEY),
      checkout(customer, addressId, KEY),
      checkout(customer, addressId, KEY),
    ]);

    // One request made the order (201); the others got the same order back (200).
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([200, 200, 200, 200, 201]);

    const orderIds = responses.map((response) => response.body.order.id);
    expect(new Set(orderIds).size).toBe(1);

    expect(await queryDb('SELECT id FROM orders')).toHaveLength(1);
    // The stock dropped once (by 2), not five times.
    expect(await getStock(SKU)).toBe(stockBefore - 2);
    expect(await queryDb('SELECT id FROM inventory_movements')).toHaveLength(1);
  });

  it('returns the same order when the request is repeated later', async () => {
    const first = await checkout(customer, addressId, KEY);
    const stockAfterFirst = await getStock(SKU);

    const second = await checkout(customer, addressId, KEY);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.order.id).toBe(first.body.order.id);
    expect(await getStock(SKU)).toBe(stockAfterFirst);
  });

  it('treats a new key with an empty cart as an empty cart', async () => {
    await checkout(customer, addressId, KEY);

    const response = await checkout(customer, addressId, 'another-new-key-2');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('CART_EMPTY');
  });

  it('allows two different users to use the same key', async () => {
    await checkout(customer, addressId, KEY);
    const other = await registerCustomer(app, 'same.key@example.test');
    await addToCart(other, SKU, 1);
    const otherAddress = await createAddress(other);

    const response = await checkout(other, otherAddress, KEY);

    expect(response.status).toBe(201);
    expect(await queryDb('SELECT id FROM orders')).toHaveLength(2);
  });
});
