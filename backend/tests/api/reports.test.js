import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, placeTestOrder, queryDb, getVariantId, ADMIN_EMAIL, CUSTOMER_EMAIL } from '../helpers.js';

// Rule 5: the dashboard numbers must agree with the orders tables.

const REVENUE = "('paid', 'packed', 'shipped', 'delivered')";

let admin;
let summary;

beforeAll(async () => {
  // The 8 sample orders plus three new orders: one placed, one paid, one paid then cancelled.
  await resetDatabase(true);
  admin = await loginAs(app, ADMIN_EMAIL);
  const customer = await loginAs(app, CUSTOMER_EMAIL);

  await placeTestOrder(customer, 'TN-TSH4-BLK-M', 1);
  const paid = await placeTestOrder(customer, 'TN-HOD4-SND-L', 1);
  await customer.post('/api/orders/' + paid.id + '/pay').send({ cardNumber: '4242424242424242' });
  const cancelled = await placeTestOrder(customer, 'TN-TOT2-BLK', 2);
  await customer.post('/api/orders/' + cancelled.id + '/pay').send({ cardNumber: '4242424242424242' });
  await customer.post('/api/orders/' + cancelled.id + '/cancel');

  summary = (await admin.get('/api/admin/reports/summary')).body;
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/admin/reports/summary', () => {
  it('revenue equals the order items plus shipping and tax of the paid orders', async () => {
    // Computed in a different way: from order_items, not from orders.total_cents.
    const items = await queryDb(
      `SELECT COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)::bigint AS total
       FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status IN ${REVENUE}`
    );
    const extras = await queryDb(
      `SELECT COALESCE(SUM(shipping_cents + tax_cents), 0)::bigint AS total FROM orders WHERE status IN ${REVENUE}`
    );

    expect(summary.revenue_cents).toBe(Number(items[0].total) + Number(extras[0].total));
    expect(summary.revenue_cents).toBeGreaterThan(0);
  });

  it('does not count placed or cancelled orders as revenue', async () => {
    const all = await queryDb('SELECT COALESCE(SUM(total_cents), 0)::bigint AS total FROM orders');

    expect(summary.revenue_cents).toBeLessThan(Number(all[0].total));
  });

  it('counts per status match the orders list', async () => {
    let sum = 0;
    for (const status of Object.keys(summary.orders_by_status)) {
      const list = await admin.get('/api/admin/orders?limit=1&status=' + status);
      expect(list.body.total).toBe(summary.orders_by_status[status]);
      sum = sum + summary.orders_by_status[status];
    }

    expect(sum).toBe(summary.order_count);
    expect(summary.order_count).toBe(11);
  });

  it('shows 14 days and the days add up to the revenue', () => {
    const daySum = summary.sales_per_day.reduce((total, day) => total + day.revenue_cents, 0);

    expect(summary.sales_per_day).toHaveLength(14);
    expect(daySum).toBe(summary.revenue_cents);
  });

  it('lists the top products by units sold, matching the order items', async () => {
    const rows = await queryDb(
      `SELECT oi.product_name, oi.quantity FROM order_items oi
       JOIN orders o ON o.id = oi.order_id WHERE o.status IN ${REVENUE}`
    );
    const units = {};
    for (const row of rows) {
      units[row.product_name] = (units[row.product_name] || 0) + row.quantity;
    }
    const best = Math.max(...Object.values(units));

    expect(summary.top_products.length).toBeLessThanOrEqual(5);
    expect(summary.top_products[0].units_sold).toBe(best);
    for (const product of summary.top_products) {
      expect(product.units_sold).toBe(units[product.product_name]);
    }
  });

  it('lists low stock variants, including the sold out one', () => {
    const skus = summary.low_stock.map((variant) => variant.sku);

    expect(skus).toContain('TN-CAP1-BLK');
    expect(skus).toContain('TN-TSH1-BLK-XL');
    expect(summary.low_stock[0].stock_qty).toBe(0);
  });
});

describe('the audit log', () => {
  it('has a row after each admin action', async () => {
    const variantId = await getVariantId('TN-TSH2-WHT-M');
    const orderList = await admin.get('/api/admin/orders?status=paid&limit=1');
    const paidOrderId = orderList.body.items[0].id;

    await admin.post('/api/admin/products').send({
      category_id: 1, name: 'Audit Tee', price_cents: 10000, variants: [{ sku: 'TN-AUD-1', stock_qty: 1 }],
    });
    await admin.patch('/api/admin/products/2').send({ price_cents: 45900 });
    await admin.post('/api/admin/variants/' + variantId + '/stock').send({ delta: 2 });
    await admin.patch('/api/admin/orders/' + paidOrderId + '/status').send({ status: 'packed' });
    await admin.delete('/api/admin/products/3');

    const response = await admin.get('/api/admin/audit?limit=50');
    const actions = response.body.items.map((row) => row.action);

    for (const action of ['product.created', 'product.updated', 'stock.adjusted', 'order.packed', 'product.deactivated']) {
      expect(actions).toContain(action);
    }
    expect(response.body.items[0].user_email).toBeTruthy();
  });

  it('filters by action prefix and by entity', async () => {
    const orderRows = await admin.get('/api/admin/audit?action=order&limit=50');
    const productRows = await admin.get('/api/admin/audit?entityType=product&entityId=2');

    expect(orderRows.body.items.every((row) => row.action.startsWith('order.'))).toBe(true);
    expect(productRows.body.items.length).toBeGreaterThan(0);
    expect(productRows.body.items.every((row) => row.entity_id === 2)).toBe(true);
  });

  it('pages the results, newest first', async () => {
    const first = await admin.get('/api/admin/audit?limit=5&page=1');
    const second = await admin.get('/api/admin/audit?limit=5&page=2');

    expect(first.body.items).toHaveLength(5);
    expect(second.body.items[0].id).toBeLessThan(first.body.items[4].id);
    expect(first.body.total).toBeGreaterThan(10);
  });
});
