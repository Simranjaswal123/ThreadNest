// SQL only. "details" is a small object that is stored as JSON.
export async function insertAuditRow(db, userId, action, entityType, entityId, details) {
  const sql = `
    INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
    VALUES ($1, $2, $3, $4, $5)
  `;
  const json = details ? JSON.stringify(details) : null;
  await db.query(sql, [userId, action, entityType, entityId, json]);
}
