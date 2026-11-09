// Fills the database with demo data. Safe to run again: it clears old data first.
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { categories } from './seedData.js';
import { addProducts } from './seedProducts.js';

// Dummy password for the two demo accounts. Never use it for anything real.
const DEMO_PASSWORD = 'Password123!';

async function clearData(client) {
  // CASCADE also empties every table that points at these two (orders, cart, and so on).
  // RESTART IDENTITY makes ids start from 1 again.
  await client.query('TRUNCATE users, categories RESTART IDENTITY CASCADE');
}

async function addUsers(client) {
  // The same hash is fine for both demo accounts.
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const sql = 'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4)';

  await client.query(sql, ['admin@threadnest.test', hash, 'Demo Admin', 'admin']);
  await client.query(sql, ['customer@threadnest.test', hash, 'Demo Customer', 'customer']);
}

// Returns something like { 'T-shirts': 1, Hoodies: 2 } so products can find their category id.
async function addCategories(client) {
  const ids = {};
  for (const name of categories) {
    const result = await client.query('INSERT INTO categories (name) VALUES ($1) RETURNING id', [name]);
    ids[name] = result.rows[0].id;
  }
  return ids;
}

async function runSeed() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // One transaction: if anything fails, the old data is kept.
    await client.query('BEGIN');
    await clearData(client);
    await addUsers(client);
    const categoryIds = await addCategories(client);
    await addProducts(client, categoryIds);
    await client.query('COMMIT');
    console.log('Seed finished.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

runSeed().catch((error) => {
  console.error('Seed failed: ' + error.message);
  process.exit(1);
});
