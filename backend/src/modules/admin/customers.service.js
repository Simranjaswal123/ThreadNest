import { pool } from '../../db/pool.js';
import { listCustomers, countCustomers } from './customers.repo.js';

export async function getCustomers(filters) {
  const rows = await listCustomers(pool, filters);
  // The database returns big sums as text, so we turn them back into numbers.
  const items = rows.map((row) => ({ ...row, total_spent_cents: Number(row.total_spent_cents) }));
  const total = await countCustomers(pool, filters);
  const totalPages = Math.ceil(total / filters.limit);
  return { items: items, total: total, page: filters.page, limit: filters.limit, totalPages: totalPages };
}
