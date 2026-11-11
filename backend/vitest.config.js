import { defineConfig } from 'vitest/config';
import { getTestDatabaseUrl } from './src/db/createTestDb.js';

// "npm run test" loads ../.env first, so DATABASE_URL points at the main database.
// We point the tests at threadnest_test instead.
const testUrl = getTestDatabaseUrl(process.env.DATABASE_URL || '');

export default defineConfig({
  test: {
    globalSetup: './tests/globalSetup.js',
    // Test files share one database, so they must run one after another.
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL: testUrl,
      JWT_SECRET: 'test-secret-not-for-production',
      LOGIN_RATE_LIMIT_MAX: '1000',
    },
  },
});
