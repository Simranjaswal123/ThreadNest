// Creates the separate test database "threadnest_test" (if missing) and migrates it.
// The tests use it so they never touch the demo data in the main database.
import { execFileSync } from 'node:child_process';
import pg from 'pg';

// Same server and login as the main database, but another database name.
export function getTestDatabaseUrl(mainUrl) {
  return mainUrl.replace(/\/[^/]*$/, '/threadnest_test');
}

export async function createTestDatabase(mainUrl) {
  const client = new pg.Client({ connectionString: mainUrl });
  await client.connect();
  try {
    const found = await client.query("SELECT 1 FROM pg_database WHERE datname = 'threadnest_test'");
    if (found.rows.length === 0) {
      await client.query('CREATE DATABASE threadnest_test');
    }
  } finally {
    await client.end();
  }

  // Reuse the normal migration runner, pointed at the test database.
  const env = { ...process.env, DATABASE_URL: getTestDatabaseUrl(mainUrl) };
  execFileSync(process.execPath, ['src/db/migrate.js'], { env: env, stdio: 'pipe' });
}
