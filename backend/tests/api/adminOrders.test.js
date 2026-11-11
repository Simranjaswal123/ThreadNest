import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, placeTestOrder, getStock, queryDb, ADMIN_EMAIL, CUSTOMER_EMAIL } from '../helpers.js';

const SKU = 'TN-TSH1-BLK-M';

let admin;
let customer;
let order;

async function payFor(agent, orderId) {
  await agent.post('/api/orders/' + orderId + '/pay').send({ cardNumber: '4242 4242 4242 4242' });
}

function setStatus(orderId, status) {
  return admin.patch('/api/admin/orders/' + orderId + '/status').send({ status: status });
}

beforeEach(async () => {
  await resetDatabase();
  admin = await loginAs(app, ADMIN_EMAIL);
  customer = await loginAs(app, CUSTOMER_EMAIL);
  order = await placeTestOrder(customer, SKU, 2);
});

afterAll(async () => {
  await pool.end();
});

describe('moving an order through its life', () => {
  it('moves a paid order through packed, shipped and delivered', async () => {
    await payFor(customer, order.id);

    const packed = await setStatus(order.id, 'packed');
    const shipped = await setStatus(order.id, 'shipped');
    const delivered = await setStatus(order.id, 'delivered');

    expect(packed.body.order.status).toBe('packed');
    expect(shipped.body.order.status).toBe('shipped');
    expect(delivered.body.order.status).toBe('delivered');
    expect(delivered.body.order.next_statuses).toEqual([]);
  });

  it('writes a history row and an audit row for every change, with the admin as actor', async () => {
    await payFor(customer, order.id);
    await setStatus(order.id, 'packed');

    const history = await queryDb('SELECT to_status, changed_by FROM order_status_history WHERE order_id = $1 ORDER BY id', [order.id]);
    const audit = await queryDb("SELECT action, user_id FROM audit_log WHERE entity_id = $1 AND action = 'order.packed'", [order.id]);
    const adminRow = await queryDb('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);

    expect(history[2].to_status).toBe('packed');
    expect(history[2].changed_by).toBe(adminRow[0].id);
    expect(audit).toEqual([{ action: 'order.packed', user_id: adminRow[0].id }]);
  });

  it('answers 409 for an illegal jump (paid straight to delivered)', async () => {
    await payFor(customer, order.id);
    const response = await setStatus(order.id, 'delivered');

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_TRANSITION');
    const row = await queryDb('SELECT status FROM orders WHERE id = $1', [order.id]);
    expect(row[0].status).toBe('paid');
  });

  it('does not let an admin mark an unpaid order as paid by hand', async () => {
    const response = await setStatus(order.id, 'paid');

    expect(response.status).toBe(409);
  });

  it('does not move an order out of delivered or cancelled', async () => {
    await payFor(customer, order.id);
    await setStatus(order.id, 'packed');
    await setStatus(order.id, 'shipped');
    await setStatus(order.id, 'delivered');

    const response = await setStatus(order.id, 'cancelled');

    expect(response.status).toBe(409);
  });

  it('puts the stock back and refunds the payment when an admin cancels', async () => {
    await payFor(customer, order.id);
    const stockWhileOrdered = await getStock(SKU);

    const response = await setStatus(order.id, 'cancelled');

    expect(response.body.order.status).toBe('cancelled');
    expect(await getStock(SKU)).toBe(stockWhileOrdered + 2);
    const payments = await queryDb('SELECT status FROM payments WHERE order_id = $1', [order.id]);
    expect(payments).toEqual([{ status: 'refunded' }]);
  });

  it('answers 400 for an unknown status and 404 for an unknown order', async () => {
    const badStatus = await setStatus(order.id, 'teleported');
    const noOrder = await setStatus(99999, 'packed');

    expect(badStatus.status).toBe(400);
    expect(noOrder.status).toBe(404);
  });
});

describe('listing orders', () => {
  it('shows orders of all customers with the legal next statuses', async () => {
    const response = await admin.get('/api/admin/orders');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].customer_email).toBe(CUSTOMER_EMAIL);
    // from "placed" an admin can only cancel (paid happens through payment)
    expect(response.body.items[0].next_statuses).toEqual(['cancelled']);
  });

  it('filters by status, by date and by search text', async () => {
    await payFor(customer, order.id);
    await placeTestOrder(customer, 'TN-SOC1-WHT', 1);

    const paid = await admin.get('/api/admin/orders?status=paid');
    const placed = await admin.get('/api/admin/orders?status=placed');
    const today = new Date().toISOString().slice(0, 10);
    const farPast = await admin.get('/api/admin/orders?from=2000-01-01&to=2000-01-31');
    const todayList = await admin.get('/api/admin/orders?from=' + today + '&to=' + today);
    const search = await admin.get('/api/admin/orders?q=customer@threadnest');
    const noMatch = await admin.get('/api/admin/orders?q=nobody-like-this');

    expect(paid.body.total).toBe(1);
    expect(placed.body.total).toBe(1);
    expect(farPast.body.total).toBe(0);
    expect(todayList.body.total).toBe(2);
    expect(search.body.total).toBe(2);
    expect(noMatch.body.total).toBe(0);
  });

  it('pages the results', async () => {
    await placeTestOrder(customer, 'TN-SOC1-WHT', 1);
    const response = await admin.get('/api/admin/orders?limit=1&page=2');

    expect(response.body.items).toHaveLength(1);
    expect(response.body.totalPages).toBe(2);
  });

  it('shows one order with the customer, items, payments and history', async () => {
    const response = await admin.get('/api/admin/orders/' + order.id);

    expect(response.body.order.customer_email).toBe(CUSTOMER_EMAIL);
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.history).toHaveLength(1);
  });
});

describe('customers', () => {
  it('lists customers with their order count and what they spent', async () => {
    await payFor(customer, order.id);
    const response = await admin.get('/api/admin/customers');
    const row = response.body.items.find((c) => c.email === CUSTOMER_EMAIL);

    expect(response.status).toBe(200);
    expect(row.order_count).toBe(1);
    expect(row.total_spent_cents).toBe(order.total_cents);
    // admins are not customers
    expect(response.body.items.find((c) => c.email === ADMIN_EMAIL)).toBeUndefined();
  });

  it('never returns a password hash', async () => {
    const response = await admin.get('/api/admin/customers');

    expect(JSON.stringify(response.body)).not.toContain('password');
  });
});
