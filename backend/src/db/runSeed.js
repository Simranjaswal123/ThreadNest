// Command line entry for "npm run seed". The seeding itself lives in seed.js.
import pg from 'pg';
import { seedDatabase } from './seed.js';

async function main() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // true = also add the sample orders for the demo dashboard
    await seedDatabase(client, true);
    console.log('Seed finished.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Seed failed: ' + error.message);
  process.exit(1);
});
