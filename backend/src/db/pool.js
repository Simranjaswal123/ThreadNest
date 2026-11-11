import pg from 'pg';
import { config } from '../config/env.js';

// One pool is shared by the whole app. It keeps a few connections open and reuses them.
export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Runs "work" inside one database transaction.
// If work throws, everything it did is rolled back; otherwise it is committed.
// Services use this when several changes must succeed or fail together.
export async function runInTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Always give the connection back to the pool.
    client.release();
  }
}
