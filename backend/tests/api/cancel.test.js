import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, registerCustomer, placeTestOrder, getStock, queryDb, CUSTOMER_EMAIL } from '../helpers.js';

const SKU = 'TN-TSH1-BLK-M';

let customer;
let order;
let startingStock;

beforeEach(async () => {
  await resetDatabase();
  startingStock = await getStock(SKU);
  customer = await loginAs(app, CUSTOMER_EMAIL);
  order = await placeTestOrder(customer, SKU, 3);
});

afterAll(async () => {
  await pool.end();
});

function cancel(agent, orderId) {
  return agent.post('/api/orders/' + orderId + '/cancel');
}

describe('POST /api/orders/:id/cancel', () => {
  it('cancels a placed order and puts the stock back exactly', async () => {
    expect(await getStock(SKU)).toBe(startingStock - 3);

    const response = await cancel(customer, order.id);

    expect(response.status).toBe(200);
    expect(response.body.order.status).toBe('cancelled');
    expect(await getStock(SKU)).toBe(startingStock);
  });

  it('writes positive ledger rows, a history row and an audit row', async () => {
    await cancel(customer, order.id);

    const movements = await queryDb('SELECT change_qty, reason FROM inventory_movements WHERE order_id = $1 ORDER BY id', [order.id]);
    const history = await queryDb('SELECT from_status, to_status FROM order_status_history WHERE order_id = $1 ORDER BY id', [order.id]);
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'order.cancelled'", [order.id]);

    expect(movements).toEqual([
      { change_qty: -3, reason: 'order_placed' },
      { change_qty: 3, reason: 'order_cancelled' },
    ]);
    expect(history[1]).toEqual({ from_status: 'placed', to_status: 'cancelled' });
    expect(audit).toHaveLength(1);
  });

  it('marks a succeeded payment as refunded', async () => {
    await customer.post('/api/orders/' + order.id + '/pay').send({ cardNumber: '4242424242424242' });

    const response = await cancel(customer, order.id);

    expect(response.body.order.status).toBe('cancelled');
    const payments = await queryDb('SELECT status FROM payments WHERE order_id = $1', [order.id]);
    expect(payments).toEqual([{ status: 'refunded' }]);
  });

  it('keeps starting stock plus the sum of ledger rows equal to the current stock', async () => {
    await cancel(customer, order.id);
    const rows = await queryDb(
      "SELECT COALESCE(SUM(change_qty), 0)::int AS total FROM inventory_movements WHERE variant_id = (SELECT id FROM variants WHERE sku = $1)",
      [SKU]
    );

    expect(startingStock + rows[0].total).toBe(await getStock(SKU));
  });

  it('answers 409 when the order is cancelled twice, and restocks only once', async () => {
    await cancel(customer, order.id);
    const second = await cancel(customer, order.id);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('INVALID_TRANSITION');
    expect(await getStock(SKU)).toBe(startingStock);
  });

  it('answers 409 when the order has already shipped', async () => {
    await queryDb("UPDATE orders SET status = 'shipped' WHERE id = $1", [order.id]);

    const response = await cancel(customer, order.id);

    expect(response.status).toBe(409);
    expect(await getStock(SKU)).toBe(startingStock - 3);
  });

  it('answers 404 for the order of another user', async () => {
    const other = await registerCustomer(app, 'cancel.thief@example.test');

    const response = await cancel(other, order.id);

    expect(response.status).toBe(404);
    expect(await getStock(SKU)).toBe(startingStock - 3);
  });
});
