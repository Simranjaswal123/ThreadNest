import { pool } from '../../db/pool.js';
import { listAuditRows, countAuditRows } from './audit.repo.js';

export async function getAuditPage(filters) {
  const items = await listAuditRows(pool, filters);
  const total = await countAuditRows(pool, filters);
  const totalPages = Math.ceil(total / filters.limit);
  return { items: items, total: total, page: filters.page, limit: filters.limit, totalPages: totalPages };
}
