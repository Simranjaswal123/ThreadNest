// Small helpers shared by the API tests.
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import request from 'supertest';
import { seedDatabase, DEMO_PASSWORD } from '../src/db/seed.js';

// Puts the test database back to the clean demo data.
// Pass true to also add the 8 sample orders (used by the reports tests).
export async function resetDatabase(withSampleOrders = false) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await seedDatabase(client, withSampleOrders);
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

// Current stock of a variant, read straight from the database.
export async function getStock(sku) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query('SELECT stock_qty FROM variants WHERE sku = $1', [sku]);
    return result.rows[0].stock_qty;
  } finally {
    await client.end();
  }
}

// Runs any SQL on the test database and returns the rows. For checking results and setting up cases.
export async function queryDb(sql, values = []) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(sql, values);
    return result.rows;
  } finally {
    await client.end();
  }
}

// Creates a new customer account through the API and returns a logged in agent.
export async function registerCustomer(app, email) {
  const agent = request.agent(app);
  const body = { email: email, password: 'secret-pass-1', full_name: 'Test Buyer' };
  const response = await agent.post('/api/auth/register').send(body);
  if (response.status !== 201) {
    throw new Error('Test register failed for ' + email + ': ' + response.status);
  }
  return agent;
}

export async function createAddress(agent) {
  const address = { full_name: 'Test Buyer', line1: '1 Test Street', city: 'Pune', postal_code: '411001', country: 'India' };
  const response = await agent.post('/api/addresses').send(address);
  return response.body.address.id;
}

export async function addToCart(agent, sku, quantity) {
  const variantId = await getVariantId(sku);
  const response = await agent.post('/api/cart/items').send({ variantId: variantId, quantity: quantity });
  if (response.status !== 201) {
    throw new Error('Test add to cart failed for ' + sku + ': ' + response.status);
  }
}

// Sends POST /api/checkout. A new random key is used unless one is given.
export async function checkout(agent, addressId, key = randomUUID()) {
  return agent.post('/api/checkout').set('Idempotency-Key', key).send({ addressId: addressId });
}

// Puts one order in the database through the real API and returns the order.
export async function placeTestOrder(agent, sku, quantity) {
  await addToCart(agent, sku, quantity);
  const addressId = await createAddress(agent);
  const response = await checkout(agent, addressId);
  if (response.status !== 201) {
    throw new Error('Test checkout failed: ' + response.status + ' ' + JSON.stringify(response.body));
  }
  return response.body.order;
}

export const ADMIN_EMAIL = 'admin@threadnest.test';
export const CUSTOMER_EMAIL = 'customer@threadnest.test';
