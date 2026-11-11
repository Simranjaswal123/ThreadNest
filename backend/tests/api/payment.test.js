import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, registerCustomer, placeTestOrder, queryDb, CUSTOMER_EMAIL } from '../helpers.js';

const GOOD_CARD = '4242 4242 4242 4242';
const DECLINED_CARD = '4000 0000 0000 0002';

let customer;
let order;

beforeEach(async () => {
  await resetDatabase();
  customer = await loginAs(app, CUSTOMER_EMAIL);
  order = await placeTestOrder(customer, 'TN-TSH1-BLK-M', 1);
});

afterAll(async () => {
  await pool.end();
});

function pay(agent, orderId, cardNumber) {
  return agent.post('/api/orders/' + orderId + '/pay').send({ cardNumber: cardNumber });
}

describe('POST /api/orders/:id/pay', () => {
  it('leaves the order placed and saves a failed payment when the card is declined', async () => {
    const response = await pay(customer, order.id, DECLINED_CARD);

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe('failed');
    expect(response.body.order.status).toBe('placed');
    const payments = await queryDb('SELECT status FROM payments WHERE order_id = $1', [order.id]);
    expect(payments).toEqual([{ status: 'failed' }]);
  });

  it('makes the order paid when the card is good', async () => {
    const response = await pay(customer, order.id, GOOD_CARD);

    expect(response.status).toBe(200);
    expect(response.body.payment.status).toBe('succeeded');
    expect(response.body.order.status).toBe('paid');
    const payments = await queryDb('SELECT status, amount_cents FROM payments WHERE order_id = $1', [order.id]);
    expect(payments).toEqual([{ status: 'succeeded', amount_cents: order.total_cents }]);
  });

  it('lets the customer try again after a declined card', async () => {
    await pay(customer, order.id, DECLINED_CARD);
    const response = await pay(customer, order.id, GOOD_CARD);

    expect(response.body.order.status).toBe('paid');
    const payments = await queryDb('SELECT status FROM payments WHERE order_id = $1 ORDER BY id', [order.id]);
    expect(payments).toEqual([{ status: 'failed' }, { status: 'succeeded' }]);
  });

  it('writes the status history and an audit row when it is paid', async () => {
    await pay(customer, order.id, GOOD_CARD);

    const history = await queryDb('SELECT from_status, to_status FROM order_status_history WHERE order_id = $1 ORDER BY id', [order.id]);
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_id = $1 AND action = 'order.paid'", [order.id]);

    expect(history[1]).toEqual({ from_status: 'placed', to_status: 'paid' });
    expect(audit).toHaveLength(1);
  });

  it('answers 409 when the order is already paid', async () => {
    await pay(customer, order.id, GOOD_CARD);
    const response = await pay(customer, order.id, GOOD_CARD);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INVALID_TRANSITION');
    const payments = await queryDb('SELECT id FROM payments WHERE order_id = $1', [order.id]);
    expect(payments).toHaveLength(1);
  });

  it('answers 404 when paying the order of another user', async () => {
    const other = await registerCustomer(app, 'not.the.owner@example.test');
    const response = await pay(other, order.id, GOOD_CARD);

    expect(response.status).toBe(404);
  });

  it('answers 400 without a card number', async () => {
    const response = await customer.post('/api/orders/' + order.id + '/pay').send({});

    expect(response.status).toBe(400);
  });

  it('answers 401 when nobody is logged in', async () => {
    const response = await request(app).post('/api/orders/' + order.id + '/pay').send({ cardNumber: GOOD_CARD });

    expect(response.status).toBe(401);
  });
});
