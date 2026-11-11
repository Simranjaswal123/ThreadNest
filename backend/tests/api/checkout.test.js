import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import {
  resetDatabase, loginAs, registerCustomer, createAddress, addToCart, checkout,
  getStock, queryDb, CUSTOMER_EMAIL,
} from '../helpers.js';

const SKU = 'TN-TSH1-BLK-M'; // Classic Crew Tee, 499.00

let customer;

beforeEach(async () => {
  await resetDatabase();
  customer = await loginAs(app, CUSTOMER_EMAIL);
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/checkout: input checks', () => {
  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).post('/api/checkout').send({ addressId: 1 });

    expect(response.status).toBe(401);
  });

  it('answers 400 when the cart is empty', async () => {
    const addressId = await createAddress(customer);
    const response = await checkout(customer, addressId);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('CART_EMPTY');
  });

  it('answers 400 without an Idempotency-Key header', async () => {
    await addToCart(customer, SKU, 1);
    const addressId = await createAddress(customer);
    const response = await customer.post('/api/checkout').send({ addressId: addressId });

    expect(response.status).toBe(400);
  });

  it('answers 404 for an address that does not exist', async () => {
    await addToCart(customer, SKU, 1);
    const response = await checkout(customer, 99999);

    expect(response.status).toBe(404);
  });

  it('answers 404 for the address of another user', async () => {
    const other = await registerCustomer(app, 'other.buyer@example.test');
    const othersAddress = await createAddress(other);
    await addToCart(customer, SKU, 1);
    const response = await checkout(customer, othersAddress);

    expect(response.status).toBe(404);
  });
});

describe('POST /api/checkout: a good order', () => {
  it('creates the order, takes the stock and empties the cart', async () => {
    await addToCart(customer, SKU, 2);
    const stockBefore = await getStock(SKU);
    const addressId = await createAddress(customer);

    const response = await checkout(customer, addressId);

    expect(response.status).toBe(201);
    const order = response.body.order;
    expect(order.status).toBe('placed');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
    expect(order.subtotal_cents).toBe(2 * 49900);
    expect(order.total_cents).toBe(order.subtotal_cents + order.shipping_cents + order.tax_cents);
    expect(order.shipping_address).toContain('1 Test Street');

    expect(await getStock(SKU)).toBe(stockBefore - 2);
    const cart = await customer.get('/api/cart');
    expect(cart.body.items).toEqual([]);
  });

  it('writes the stock ledger, the status history and an audit row', async () => {
    await addToCart(customer, SKU, 2);
    const addressId = await createAddress(customer);
    const response = await checkout(customer, addressId);
    const orderId = response.body.order.id;

    const movements = await queryDb('SELECT change_qty, reason FROM inventory_movements WHERE order_id = $1', [orderId]);
    const history = await queryDb('SELECT from_status, to_status FROM order_status_history WHERE order_id = $1', [orderId]);
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_type = 'order' AND entity_id = $1", [orderId]);

    expect(movements).toEqual([{ change_qty: -2, reason: 'order_placed' }]);
    expect(history).toEqual([{ from_status: null, to_status: 'placed' }]);
    expect(audit).toEqual([{ action: 'order.placed' }]);
  });

  it('keeps the old price on the order when the product price changes later', async () => {
    await addToCart(customer, SKU, 1);
    const addressId = await createAddress(customer);
    const response = await checkout(customer, addressId);
    await queryDb('UPDATE products SET price_cents = 99900 WHERE id = 1');

    const again = await customer.get('/api/orders/' + response.body.order.id);

    expect(again.body.order.items[0].unit_price_cents).toBe(49900);
  });
});
