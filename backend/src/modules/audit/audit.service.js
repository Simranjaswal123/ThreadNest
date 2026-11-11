import { insertAuditRow } from './audit.repo.js';

// Writes one audit row: who did what to which record.
// Rule 5: always pass the same "db" client that the action itself uses. Then the audit row
// is part of the same transaction: both are saved, or both are rolled back.
// Example: await recordAudit(client, userId, 'order.placed', 'order', orderId, { total_cents: 500 });
export async function recordAudit(db, userId, action, entityType, entityId, details) {
  await insertAuditRow(db, userId, action, entityType, entityId, details);
}
