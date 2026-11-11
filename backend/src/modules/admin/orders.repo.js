// SQL only. Admin queries see the orders of all customers.
import { createFilter, escapeLike } from '../../lib/sqlFilter.js';

function buildFilter(filters) {
  const filter = createFilter();
  if (filters.status) {
    filter.add('o.status = ?', filters.status);
  }
  if (filters.from) {
    filter.add('o.created_at >= ?::date', filters.from);
  }
  if (filters.to) {
    // "to" includes the whole last day, so we compare with the next day.
    filter.add('o.created_at < (?::date + 1)', filters.to);
  }
  if (filters.q) {
    // Search by order number, or by the customer's name or email. The same "contains" pattern
    // is used for all three, so searching "12" finds order 12 and also order 112.
    const like = '%' + escapeLike(filters.q) + '%';
    filter.add('(CAST(o.id AS TEXT) LIKE ? OR u.email ILIKE ? OR u.full_name ILIKE ?)', like);
  }
  return filter;
}

export async function listAdminOrders(db, filters) {
  const filter = buildFilter(filters);
  const n = filter.values.length;
  const sql = `
    SELECT o.id, o.status, o.total_cents, o.created_at, u.email AS customer_email, u.full_name AS customer_name,
           (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o
    JOIN users u ON u.id = o.user_id
    ${filter.where()}
    ORDER BY o.created_at DESC, o.id DESC
    LIMIT $${n + 1} OFFSET $${n + 2}
  `;
  const offset = (filters.page - 1) * filters.limit;
  const result = await db.query(sql, [...filter.values, filters.limit, offset]);
  return result.rows;
}

export async function countAdminOrders(db, filters) {
  const filter = buildFilter(filters);
  const sql = 'SELECT COUNT(*)::int AS total FROM orders o JOIN users u ON u.id = o.user_id ' + filter.where();
  const result = await db.query(sql, filter.values);
  return result.rows[0].total;
}

// One order with the customer details.
export async function findAdminOrder(db, orderId) {
  const sql = `
    SELECT o.id, o.status, o.shipping_address, o.subtotal_cents, o.shipping_cents, o.tax_cents,
           o.total_cents, o.created_at, o.updated_at,
           u.id AS customer_id, u.email AS customer_email, u.full_name AS customer_name
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE o.id = $1
  `;
  const result = await db.query(sql, [orderId]);
  return result.rows[0] || null;
}
