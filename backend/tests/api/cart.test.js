import request from 'supertest';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, getVariantId, CUSTOMER_EMAIL, ADMIN_EMAIL } from '../helpers.js';

let customer;
let tshirtM; // TN-TSH1-BLK-M: Classic Crew Tee, 499.00, plenty of stock
let tshirtXL; // TN-TSH1-BLK-XL: only 1 in stock
let soldOutCap; // TN-CAP1-BLK: stock 0

beforeAll(async () => {
  await resetDatabase();
  tshirtM = await getVariantId('TN-TSH1-BLK-M');
  tshirtXL = await getVariantId('TN-TSH1-BLK-XL');
  soldOutCap = await getVariantId('TN-CAP1-BLK');
  customer = await loginAs(app, CUSTOMER_EMAIL);
});

beforeEach(async () => {
  await pool.query('DELETE FROM cart_items');
});

afterAll(async () => {
  await pool.end();
});

describe('cart access', () => {
  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).get('/api/cart');

    expect(response.status).toBe(401);
  });

  it('starts empty with zero totals', async () => {
    const response = await customer.get('/api/cart');

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
    expect(response.body.total_cents).toBe(0);
  });
});

describe('adding items', () => {
  it('adds an item and prices it', async () => {
    const response = await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].line_total_cents).toBe(2 * 49900);
    expect(response.body.subtotal_cents).toBe(99800);
    // 99800 is below the free-shipping threshold of 99900, so shipping is charged
    expect(response.body.shipping_cents).toBe(9900);
    expect(response.body.tax_cents).toBe(4990);
    expect(response.body.total_cents).toBe(99800 + 9900 + 4990);
  });

  it('adds to the same line when the variant is added again', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 1 });
    const response = await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 2 });

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(3);
  });

  it('refuses more than the stock', async () => {
    const response = await customer.post('/api/cart/items').send({ variantId: tshirtXL, quantity: 2 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('OUT_OF_STOCK');
  });

  it('refuses a sold out variant', async () => {
    const response = await customer.post('/api/cart/items').send({ variantId: soldOutCap, quantity: 1 });

    expect(response.status).toBe(409);
  });

  it('refuses a quantity below 1', async () => {
    const response = await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 0 });

    expect(response.status).toBe(400);
  });

  it('refuses more than 10 of one item in total', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 6 });
    const response = await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 6 });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('QUANTITY_LIMIT');
  });

  it('answers 404 for a variant that does not exist', async () => {
    const response = await customer.post('/api/cart/items').send({ variantId: 99999, quantity: 1 });

    expect(response.status).toBe(404);
  });
});

describe('changing and removing items', () => {
  it('changes the quantity of a line', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 1 });
    const response = await customer.patch('/api/cart/items/' + tshirtM).send({ quantity: 4 });

    expect(response.status).toBe(200);
    expect(response.body.items[0].quantity).toBe(4);
  });

  it('answers 404 when changing a line that is not in the cart', async () => {
    const response = await customer.patch('/api/cart/items/' + tshirtM).send({ quantity: 2 });

    expect(response.status).toBe(404);
  });

  it('removes a line', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 1 });
    const response = await customer.delete('/api/cart/items/' + tshirtM);

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  });
});

describe('cart ownership and persistence', () => {
  it('survives logout and login', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 2 });
    await customer.post('/api/auth/logout');

    const again = await loginAs(app, CUSTOMER_EMAIL);
    const response = await again.get('/api/cart');

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].quantity).toBe(2);
    customer = again;
  });

  it('keeps carts of different users apart', async () => {
    await customer.post('/api/cart/items').send({ variantId: tshirtM, quantity: 1 });
    const admin = await loginAs(app, ADMIN_EMAIL);
    const response = await admin.get('/api/cart');

    expect(response.body.items).toEqual([]);
  });
});
