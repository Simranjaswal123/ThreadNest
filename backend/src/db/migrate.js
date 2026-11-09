// Runs every .sql file in the migrations folder, in order, once each.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const migrationsFolder = fileURLToPath(new URL('./migrations', import.meta.url));

// Sorted names (001, 002, ...) give the right order.
function getSqlFiles() {
  return fs.readdirSync(migrationsFolder).filter((name) => name.endsWith('.sql')).sort();
}

// This table remembers which files have already run.
async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function alreadyApplied(client, file) {
  const result = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [file]);
  return result.rows.length > 0;
}

// The file and its record are saved together, or not at all.
async function applyMigration(client, file) {
  const sql = fs.readFileSync(path.join(migrationsFolder, file), 'utf8');
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw new Error(file + ' failed: ' + error.message);
  }
}

async function runMigrations() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await createMigrationsTable(client);
    for (const file of getSqlFiles()) {
      if (await alreadyApplied(client, file)) {
        console.log('skipped ' + file);
        continue;
      }
      await applyMigration(client, file);
      console.log('applied ' + file);
    }
  } finally {
    await client.end();
  }
}

runMigrations().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
