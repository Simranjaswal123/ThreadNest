// SQL only. Every function takes "db", which is the pool or a transaction client.

// Includes the password hash. Only the login code may use this one.
export async function findUserByEmail(db, email) {
  const sql = 'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1';
  const result = await db.query(sql, [email]);
  return result.rows[0] || null;
}

// Never selects the hash, so it cannot leak into a response.
export async function findUserById(db, id) {
  const sql = 'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1';
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

// The role column is not set here, so the database default 'customer' is used.
export async function createUser(db, email, passwordHash, fullName) {
  const sql = `
    INSERT INTO users (email, password_hash, full_name)
    VALUES ($1, $2, $3)
    RETURNING id, email, full_name, role
  `;
  const result = await db.query(sql, [email, passwordHash, fullName]);
  return result.rows[0];
}
