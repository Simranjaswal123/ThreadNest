// SQL only. The dashboard numbers all come from SQL over the orders tables.
// Revenue = the total of orders in paid, packed, shipped or delivered (see lib/revenue.js).
import { REVENUE_STATUSES } from '../../lib/revenue.js';

export async function getRevenueTotals(db) {
  const sql = `
    SELECT COALESCE(SUM(total_cents), 0)::bigint AS revenue_cents, COUNT(*)::int AS revenue_order_count
    FROM orders
    WHERE status = ANY($1::text[])
  `;
  const result = await db.query(sql, [REVENUE_STATUSES]);
  return result.rows[0];
}

export async function getOrderCount(db) {
  const result = await db.query('SELECT COUNT(*)::int AS total FROM orders');
  return result.rows[0].total;
}

export async function getOrdersByStatus(db) {
  const result = await db.query('SELECT status, COUNT(*)::int AS total FROM orders GROUP BY status');
  return result.rows;
}

// One row for each of the last 14 days (today included), with 0 for days without sales.
// A sale counts on the day the order was created.
export async function getSalesPerDay(db) {
  const sql = `
    SELECT to_char(d, 'YYYY-MM-DD') AS day,
           COALESCE(SUM(o.total_cents), 0)::bigint AS revenue_cents,
           COUNT(o.id)::int AS order_count
    FROM generate_series((CURRENT_DATE - 13)::timestamp, CURRENT_DATE::timestamp, interval '1 day') AS d
    LEFT JOIN orders o ON o.created_at::date = d::date AND o.status = ANY($1::text[])
    GROUP BY d
    ORDER BY d
  `;
  const result = await db.query(sql, [REVENUE_STATUSES]);
  return result.rows;
}

// The 5 products with the most units sold. Revenue here is the price of the items only
// (shipping and tax are not part of a product's sales).
export async function getTopProducts(db) {
  const sql = `
    SELECT oi.product_name, SUM(oi.quantity)::int AS units_sold,
           SUM(oi.quantity * oi.unit_price_cents)::bigint AS revenue_cents
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.status = ANY($1::text[])
    GROUP BY oi.product_name
    ORDER BY units_sold DESC, oi.product_name
    LIMIT 5
  `;
  const result = await db.query(sql, [REVENUE_STATUSES]);
  return result.rows;
}

// Active products' variants with 5 or fewer left, lowest stock first.
export async function getLowStock(db) {
  const sql = `
    SELECT v.id AS variant_id, v.sku, p.name AS product_name, v.stock_qty
    FROM variants v
    JOIN products p ON p.id = v.product_id
    WHERE p.is_active = TRUE AND v.stock_qty <= 5
    ORDER BY v.stock_qty, v.sku
    LIMIT 20
  `;
  const result = await db.query(sql);
  return result.rows;
}
