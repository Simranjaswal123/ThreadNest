// Small helpers shared by the API tests.
import pg from 'pg';
import request from 'supertest';
import { seedDatabase, DEMO_PASSWORD } from '../src/db/seed.js';

// Puts the test database back to the clean demo data.
export async function resetDatabase() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await seedDatabase(client);
  } finally {
    await client.end();
  }
}

// Returns a supertest "agent". An agent remembers cookies, like a browser does.
export async function loginAs(app, email) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({ email: email, password: DEMO_PASSWORD });
  if (response.status !== 200) {
    throw new Error('Test login failed for ' + email + ': ' + response.status);
  }
  return agent;
}

// Finds the id of a variant from its SKU, like 'TN-TSH1-BLK-M'.
export async function getVariantId(sku) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('SELECT id FROM variants WHERE sku = $1', [sku]);
    return result.rows[0].id;
  } finally {
    await client.end();
  }
}

export const ADMIN_EMAIL = 'admin@threadnest.test';
export const CUSTOMER_EMAIL = 'customer@threadnest.test';
