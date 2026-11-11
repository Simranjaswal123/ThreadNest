import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase } from '../helpers.js';

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe('GET /api/categories', () => {
  it('lists the five categories with slugs', async () => {
    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body.categories).toHaveLength(5);
    expect(response.body.categories[0].slug).toBe('t-shirts');
  });
});

describe('GET /api/products', () => {
  it('returns the first page and the total', async () => {
    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(30);
    expect(response.body.items).toHaveLength(12);
    expect(response.body.totalPages).toBe(3);
  });

  it('gives different items on page 2', async () => {
    const first = await request(app).get('/api/products?page=1');
    const second = await request(app).get('/api/products?page=2');

    expect(second.body.page).toBe(2);
    expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
  });

  it('searches by text, including the category name', async () => {
    const response = await request(app).get('/api/products?q=shirt');

    expect(response.body.total).toBe(6);
    expect(response.body.items[0].category_name).toBe('T-shirts');
  });

  it('filters by category', async () => {
    const response = await request(app).get('/api/products?category=2');

    expect(response.body.total).toBe(6);
    expect(response.body.items.every((item) => item.category_id === 2)).toBe(true);
  });

  it('sorts by price from low to high', async () => {
    const response = await request(app).get('/api/products?sort=price_asc&limit=30');
    const prices = response.body.items.map((item) => item.price_cents);
    const sorted = [...prices].sort((a, b) => a - b);

    expect(prices).toEqual(sorted);
  });

  it('filters by a price range', async () => {
    const response = await request(app).get('/api/products?minPrice=100000&maxPrice=130000');

    expect(response.body.total).toBeGreaterThan(0);
    for (const item of response.body.items) {
      expect(item.price_cents).toBeGreaterThanOrEqual(100000);
      expect(item.price_cents).toBeLessThanOrEqual(130000);
    }
  });

  it('answers 400 for a bad query value', async () => {
    const response = await request(app).get('/api/products?page=0');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('treats a SQL injection attempt as plain text', async () => {
    const response = await request(app).get("/api/products?q=' OR 1=1 --");

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
  });

  it('hides products that are deactivated', async () => {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = 1');
    const list = await request(app).get('/api/products?limit=50');
    const one = await request(app).get('/api/products/1');
    await pool.query('UPDATE products SET is_active = TRUE WHERE id = 1');

    expect(list.body.total).toBe(29);
    expect(one.status).toBe(404);
  });
});

describe('GET /api/products/:id', () => {
  it('returns the product with its variants', async () => {
    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(200);
    expect(response.body.product.name).toBe('Classic Crew Tee');
    // 4 sizes x 2 colours
    expect(response.body.product.variants).toHaveLength(8);
  });

  it('answers 404 for an unknown product', async () => {
    const response = await request(app).get('/api/products/9999');

    expect(response.status).toBe(404);
  });
});
