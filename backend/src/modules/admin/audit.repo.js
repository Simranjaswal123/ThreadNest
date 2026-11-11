// SQL only. Reads the audit log (rows are written by modules/audit).
import { createFilter, escapeLike } from '../../lib/sqlFilter.js';

function buildFilter(filters) {
  const filter = createFilter();
  if (filters.action) {
    // "order" finds order.placed, order.paid, ... because it matches the start of the action.
    filter.add('a.action LIKE ?', escapeLike(filters.action) + '%');
  }
  if (filters.entityType) {
    filter.add('a.entity_type = ?', filters.entityType);
  }
  if (filters.entityId) {
    filter.add('a.entity_id = ?', filters.entityId);
  }
  if (filters.userId) {
    filter.add('a.user_id = ?', filters.userId);
  }
  if (filters.from) {
    filter.add('a.created_at >= ?::date', filters.from);
  }
  if (filters.to) {
    filter.add('a.created_at < (?::date + 1)', filters.to);
  }
  return filter;
}

export async function listAuditRows(db, filters) {
  const filter = buildFilter(filters);
  const n = filter.values.length;
  const sql = `
    SELECT a.id, a.created_at, a.action, a.entity_type, a.entity_id, a.details, u.email AS user_email
    FROM audit_log a
    JOIN users u ON u.id = a.user_id
    ${filter.where()}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT $${n + 1} OFFSET $${n + 2}
  `;
  const offset = (filters.page - 1) * filters.limit;
  const result = await db.query(sql, [...filter.values, filters.limit, offset]);
  return result.rows;
}

export async function countAuditRows(db, filters) {
  const filter = buildFilter(filters);
  const result = await db.query('SELECT COUNT(*)::int AS total FROM audit_log a ' + filter.where(), filter.values);
  return result.rows[0].total;
}
