import { createTestDatabase } from '../src/db/createTestDb.js';

// Runs once before all test files: make sure the test database exists and is migrated.
export default async function setup() {
  await createTestDatabase(process.env.DATABASE_URL);
}
