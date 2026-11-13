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

// ----- Forgot password -----

// A reset link works for 30 minutes.
export async function insertResetToken(db, userId, tokenHash) {
  const sql = `
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '30 minutes')
  `;
  await db.query(sql, [userId, tokenHash]);
}

// Uses a token in ONE step: only an unused token that has not expired matches.
// So two clicks on the same link can never both work. Returns the user id, or null.
export async function useResetToken(db, tokenHash) {
  const sql = `
    UPDATE password_reset_tokens SET used_at = NOW()
    WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
    RETURNING user_id
  `;
  const result = await db.query(sql, [tokenHash]);
  return result.rows.length > 0 ? result.rows[0].user_id : null;
}

// Switches off every link of a user that has not been used yet.
export async function cancelResetTokens(db, userId) {
  const sql = 'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL';
  await db.query(sql, [userId]);
}

export async function updatePassword(db, userId, passwordHash) {
  await db.query('UPDATE users SET password_hash = $2 WHERE id = $1', [userId, passwordHash]);
}
