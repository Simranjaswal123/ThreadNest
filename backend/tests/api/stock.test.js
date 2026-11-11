import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import {
  resetDatabase, registerCustomer, createAddress, addToCart, checkout, getStock, queryDb,
} from '../helpers.js';

// Rule 1: stock never goes negative, even when buyers arrive at the same moment.

const LAST_ONE = 'TN-TSH1-BLK-XL'; // the seed gives this variant exactly 1 in stock
const PLENTY = 'TN-TSH1-BLK-M';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

// Registers a buyer who has one item in the cart and an address, ready to check out.
async function readyBuyer(email, sku, quantity) {
  const agent = await registerCustomer(app, email);
  await addToCart(agent, sku, quantity);
  const addressId = await createAddress(agent);
  return { agent: agent, addressId: addressId };
}

describe('stock protection', () => {
  it('lets only one of two buyers take the last item', async () => {
    const first = await readyBuyer('first@example.test', LAST_ONE, 1);
    const second = await readyBuyer('second@example.test', LAST_ONE, 1);

    // Promise.all sends both requests at the same time.
    const responses = await Promise.all([
      checkout(first.agent, first.addressId),
      checkout(second.agent, second.addressId),
    ]);

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([201, 409]);
    const loser = responses.find((response) => response.status === 409);
    expect(loser.body.error.code).toBe('OUT_OF_STOCK');

    expect(await getStock(LAST_ONE)).toBe(0);
    const orders = await queryDb('SELECT id FROM orders');
    expect(orders).toHaveLength(1);
  });

  it('sells exactly the stock that exists when five buyers race for two items', async () => {
    await queryDb('UPDATE variants SET stock_qty = 2 WHERE sku = $1', [PLENTY]);
    const buyers = [];
    for (let i = 1; i <= 5; i++) {
      buyers.push(await readyBuyer('racer' + i + '@example.test', PLENTY, 1));
    }

    const responses = await Promise.all(buyers.map((buyer) => checkout(buyer.agent, buyer.addressId)));

    const created = responses.filter((response) => response.status === 201);
    const refused = responses.filter((response) => response.status === 409);
    expect(created).toHaveLength(2);
    expect(refused).toHaveLength(3);
    expect(await getStock(PLENTY)).toBe(0);
  });

  it('refuses an order for more than the stock left', async () => {
    const buyer = await readyBuyer('greedy@example.test', PLENTY, 2);
    await queryDb('UPDATE variants SET stock_qty = 1 WHERE sku = $1', [PLENTY]);

    const response = await checkout(buyer.agent, buyer.addressId);

    expect(response.status).toBe(409);
    expect(await getStock(PLENTY)).toBe(1);
  });

  it('rolls everything back when one line is out of stock', async () => {
    const buyer = await readyBuyer('twolines@example.test', PLENTY, 2);
    await addToCart(buyer.agent, LAST_ONE, 1);
    // The second line sells out after it was put in the cart.
    await queryDb('UPDATE variants SET stock_qty = 0 WHERE sku = $1', [LAST_ONE]);
    const stockBefore = await getStock(PLENTY);

    const response = await checkout(buyer.agent, buyer.addressId);

    expect(response.status).toBe(409);
    // The first line was fine, but its stock must be untouched and no order saved.
    expect(await getStock(PLENTY)).toBe(stockBefore);
    expect(await queryDb('SELECT id FROM orders')).toHaveLength(0);
    expect(await queryDb('SELECT id FROM inventory_movements')).toHaveLength(0);
    const cart = await buyer.agent.get('/api/cart');
    expect(cart.body.items).toHaveLength(2);
  });
});
