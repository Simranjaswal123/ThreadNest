// SQL only. Customers with how many orders they made and how much they spent.
import { createFilter, escapeLike } from '../../lib/sqlFilter.js';
import { REVENUE_STATUSES } from '../../lib/revenue.js';

function buildFilter(filters) {
  const filter = createFilter();
  filter.addFixed("u.role = 'customer'");
  if (filters.q) {
    filter.add('(u.email ILIKE ? OR u.full_name ILIKE ?)', '%' + escapeLike(filters.q) + '%');
  }
  return filter;
}

export async function listCustomers(db, filters) {
  const filter = buildFilter(filters);
  const n = filter.values.length;
  // The statuses that count as revenue are sent as an array parameter.
  const sql = `
    SELECT u.id, u.email, u.full_name, u.created_at,
           (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count,
           (SELECT COALESCE(SUM(o.total_cents), 0)::bigint FROM orders o
             WHERE o.user_id = u.id AND o.status = ANY($${n + 1}::text[])) AS total_spent_cents
    FROM users u
    ${filter.where()}
    ORDER BY u.id
    LIMIT $${n + 2} OFFSET $${n + 3}
  `;
  const offset = (filters.page - 1) * filters.limit;
  const result = await db.query(sql, [...filter.values, REVENUE_STATUSES, filters.limit, offset]);
  return result.rows;
}

export async function countCustomers(db, filters) {
  const filter = buildFilter(filters);
  const result = await db.query('SELECT COUNT(*)::int AS total FROM users u ' + filter.where(), filter.values);
  return result.rows[0].total;
}
