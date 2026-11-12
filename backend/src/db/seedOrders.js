// Sample orders so that the admin dashboard is not empty. Called by seed.js.
// They are written straight into the tables, but they follow the same rules as a real checkout:
// stock goes down, and the stock ledger, status history, payments and audit rows all match.
import { calculateTotals } from '../lib/pricing.js';

// path = the statuses the order went through. daysAgo = how old the order is.
// None of these variants is one of the special low-stock ones from seedData.js.
const sampleOrders = [
  { daysAgo: 13, path: ['placed', 'paid', 'packed', 'shipped', 'delivered'], items: [['TN-TSH2-NVY-M', 2], ['TN-SOC1-WHT', 1]] },
  { daysAgo: 11, path: ['placed', 'paid', 'packed', 'shipped', 'delivered'], items: [['TN-HOD2-BLK-L', 1]] },
  { daysAgo: 9, path: ['placed', 'paid', 'packed', 'shipped', 'delivered'], items: [['TN-CAP2-SND', 1], ['TN-TOT1-SND', 1]] },
  { daysAgo: 7, path: ['placed', 'paid', 'packed', 'shipped'], items: [['TN-TSH3-GRY-S', 1], ['TN-SOC2-WHT', 3]] },
  { daysAgo: 5, path: ['placed', 'paid', 'packed'], items: [['TN-HOD3-NVY-M', 1]] },
  { daysAgo: 4, path: ['placed', 'paid', 'cancelled'], items: [['TN-TOT3-OLV', 2]] },
  { daysAgo: 3, path: ['placed', 'paid'], items: [['TN-TSH5-WHT-L', 2]] },
  { daysAgo: 1, path: ['placed'], items: [['TN-CAP5-BLK', 1]] },
];

// "n days ago, plus h hours": every row of one order gets a believable time.
// $1 is the days and $2 is the hours in every query that uses it.
const timeSql = 'NOW() - make_interval(days => $1::int) + make_interval(hours => $2::int)';

async function findLines(client, items) {
  const lines = [];
  for (const [sku, quantity] of items) {
    const sql = `
      SELECT v.id AS variant_id, v.sku, p.name AS product_name, p.price_cents
      FROM variants v JOIN products p ON p.id = v.product_id WHERE v.sku = $1
    `;
    const result = await client.query(sql, [sku]);
    lines.push({ ...result.rows[0], quantity: quantity });
  }
  return lines;
}

async function insertSampleOrder(client, sample, number, customerId, totals) {
  const finalStatus = sample.path[sample.path.length - 1];
  const sql = `
    INSERT INTO orders (user_id, shipping_address, status, subtotal_cents, shipping_cents, tax_cents,
                        total_cents, idempotency_key, created_at, updated_at)
    VALUES ($3, $4, $5, $6, $7, $8, $9, $10, ${timeSql},
            NOW() - make_interval(days => $1::int) + make_interval(hours => $11::int))
    RETURNING id
  `;
  const address = 'Demo Customer\n12 Market Road\nPune 411001\nIndia';
  const values = [
    sample.daysAgo, 0, customerId, address, finalStatus, totals.subtotal_cents, totals.shipping_cents,
    totals.tax_cents, totals.total_cents, 'seed-order-' + number, sample.path.length - 1,
  ];
  const result = await client.query(sql, values);
  return result.rows[0].id;
}

// The items of the order, the stock they took and the ledger rows for it.
async function addLinesAndStock(client, sample, orderId, lines, customerId, adminId) {
  const cancelled = sample.path.includes('cancelled');
  const lastHour = sample.path.length - 1;
  const movement = `
    INSERT INTO inventory_movements (variant_id, change_qty, reason, order_id, created_by, created_at)
    VALUES ($3, $4, $5, $6, $7, ${timeSql})
  `;

  for (const line of lines) {
    const itemSql = `
      INSERT INTO order_items (order_id, variant_id, product_name, sku, unit_price_cents, quantity)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(itemSql, [orderId, line.variant_id, line.product_name, line.sku, line.price_cents, line.quantity]);

    // The sale takes the stock. A cancelled order gives it back (same as a real cancel).
    const taken = cancelled ? 0 : line.quantity;
    await client.query('UPDATE variants SET stock_qty = stock_qty - $1 WHERE id = $2', [taken, line.variant_id]);

    await client.query(movement, [sample.daysAgo, 0, line.variant_id, -line.quantity, 'order_placed', orderId, customerId]);
    if (cancelled) {
      const back = [sample.daysAgo, lastHour, line.variant_id, line.quantity, 'order_cancelled', orderId, adminId];
      await client.query(movement, back);
    }
  }
}

// One history row, one audit row per status, and a payment once the order is paid.
async function addHistoryPaymentsAndAudit(client, sample, orderId, totalCents, customerId, adminId) {
  for (let step = 0; step < sample.path.length; step++) {
    const to = sample.path[step];
    const from = step === 0 ? null : sample.path[step - 1];
    const actor = ['packed', 'shipped', 'delivered'].includes(to) ? adminId : customerId;

    const history = `
      INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, created_at)
      VALUES ($3, $4, $5, $6, ${timeSql})
    `;
    await client.query(history, [sample.daysAgo, step, orderId, from, to, actor]);

    const audit = `
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, created_at)
      VALUES ($3, $4, 'order', $5, $6, ${timeSql})
    `;
    const details = JSON.stringify({ from: from, to: to });
    await client.query(audit, [sample.daysAgo, step, actor, 'order.' + to, orderId, details]);

    if (to === 'paid') {
      const status = sample.path.includes('cancelled') ? 'refunded' : 'succeeded';
      const payment = `
        INSERT INTO payments (order_id, amount_cents, status, created_at)
        VALUES ($3, $4, $5, ${timeSql})
      `;
      await client.query(payment, [sample.daysAgo, step, orderId, totalCents, status]);
    }
  }
}

async function addOneOrder(client, sample, number, customerId, adminId) {
  const lines = await findLines(client, sample.items);
  let subtotal = 0;
  for (const line of lines) {
    subtotal = subtotal + line.price_cents * line.quantity;
  }
  const totals = calculateTotals(subtotal);

  const orderId = await insertSampleOrder(client, sample, number, customerId, totals);
  await addLinesAndStock(client, sample, orderId, lines, customerId, adminId);
  await addHistoryPaymentsAndAudit(client, sample, orderId, totals.total_cents, customerId, adminId);
}

export async function addSampleOrders(client) {
  const users = await client.query("SELECT id, role FROM users WHERE email LIKE '%@threadnest.test'");
  const customerId = users.rows.find((user) => user.role === 'customer').id;
  const adminId = users.rows.find((user) => user.role === 'admin').id;

  let number = 1;
  for (const sample of sampleOrders) {
    await addOneOrder(client, sample, number, customerId, adminId);
    number = number + 1;
  }
}
