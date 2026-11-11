// SQL only. Every query is limited to one user_id, so people only ever see their own addresses.

const columns = 'id, full_name, line1, line2, city, postal_code, country, phone, created_at';

export async function listAddresses(db, userId) {
  const sql = 'SELECT ' + columns + ' FROM addresses WHERE user_id = $1 ORDER BY id';
  const result = await db.query(sql, [userId]);
  return result.rows;
}

// Returns null when the address does not exist or belongs to somebody else.
export async function findAddressForUser(db, addressId, userId) {
  const sql = 'SELECT ' + columns + ' FROM addresses WHERE id = $1 AND user_id = $2';
  const result = await db.query(sql, [addressId, userId]);
  return result.rows[0] || null;
}

export async function insertAddress(db, userId, a) {
  const sql = `
    INSERT INTO addresses (user_id, full_name, line1, line2, city, postal_code, country, phone)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${columns}
  `;
  const values = [userId, a.full_name, a.line1, a.line2, a.city, a.postal_code, a.country, a.phone];
  const result = await db.query(sql, values);
  return result.rows[0];
}

// Returns how many rows were deleted (0 or 1).
export async function deleteAddress(db, addressId, userId) {
  const sql = 'DELETE FROM addresses WHERE id = $1 AND user_id = $2';
  const result = await db.query(sql, [addressId, userId]);
  return result.rowCount;
}
