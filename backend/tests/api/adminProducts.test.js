import request from 'supertest';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { app } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, loginAs, getStock, queryDb, getVariantId, ADMIN_EMAIL } from '../helpers.js';

let admin;

const newProduct = {
  category_id: 3,
  name: 'Wool Beanie',
  description: 'Warm and soft',
  price_cents: 39900,
  variants: [
    { sku: 'TN-WBN-GRY', color: 'Grey', stock_qty: 10 },
    { sku: 'TN-WBN-BLK', color: 'Black', stock_qty: 0 },
  ],
};

beforeEach(async () => {
  await resetDatabase();
  admin = await loginAs(app, ADMIN_EMAIL);
});

afterAll(async () => {
  await pool.end();
});

describe('creating products', () => {
  it('creates a product with its variants', async () => {
    const response = await admin.post('/api/admin/products').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.product.name).toBe('Wool Beanie');
    expect(response.body.product.variants).toHaveLength(2);
  });

  it('writes the starting stock to the ledger and an audit row', async () => {
    const response = await admin.post('/api/admin/products').send(newProduct);
    const productId = response.body.product.id;

    const movements = await queryDb(
      "SELECT change_qty, reason FROM inventory_movements WHERE variant_id = (SELECT id FROM variants WHERE sku = 'TN-WBN-GRY')"
    );
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_type = 'product' AND entity_id = $1", [productId]);

    expect(movements).toEqual([{ change_qty: 10, reason: 'admin_adjustment' }]);
    expect(audit).toEqual([{ action: 'product.created' }]);
  });

  it('refuses a product without variants', async () => {
    const response = await admin.post('/api/admin/products').send({ ...newProduct, variants: [] });

    expect(response.status).toBe(400);
  });

  it('answers 409 for a SKU that is already used, and saves nothing', async () => {
    const body = { ...newProduct, variants: [{ sku: 'TN-TSH1-BLK-M', stock_qty: 1 }] };
    const response = await admin.post('/api/admin/products').send(body);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('SKU_TAKEN');
    const rows = await queryDb("SELECT id FROM products WHERE name = 'Wool Beanie'");
    expect(rows).toHaveLength(0);
  });

  it('answers 400 for a category that does not exist', async () => {
    const response = await admin.post('/api/admin/products').send({ ...newProduct, category_id: 999 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('CATEGORY_NOT_FOUND');
  });
});

describe('editing and deactivating products', () => {
  it('changes the price and writes an audit row', async () => {
    const response = await admin.patch('/api/admin/products/1').send({ price_cents: 55000 });
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_type = 'product' AND entity_id = 1");

    expect(response.status).toBe(200);
    expect(response.body.product.price_cents).toBe(55000);
    expect(audit).toEqual([{ action: 'product.updated' }]);
  });

  it('answers 400 when no field is sent', async () => {
    const response = await admin.patch('/api/admin/products/1').send({});

    expect(response.status).toBe(400);
  });

  it('answers 404 for an unknown product', async () => {
    const response = await admin.patch('/api/admin/products/9999').send({ price_cents: 100 });

    expect(response.status).toBe(404);
  });

  it('deactivates instead of deleting: hidden from the shop, still there for the admin', async () => {
    const response = await admin.delete('/api/admin/products/1');
    const publicList = await request(app).get('/api/products?limit=50');
    const publicOne = await request(app).get('/api/products/1');
    const adminOne = await admin.get('/api/admin/products/1');
    const audit = await queryDb("SELECT action FROM audit_log WHERE entity_type = 'product' AND entity_id = 1");

    expect(response.body.product.is_active).toBe(false);
    expect(publicList.body.total).toBe(29);
    expect(publicOne.status).toBe(404);
    expect(adminOne.status).toBe(200);
    expect(audit).toEqual([{ action: 'product.deactivated' }]);
  });

  it('lists inactive products for the admin with a filter', async () => {
    await admin.delete('/api/admin/products/2');
    const response = await admin.get('/api/admin/products?active=false');

    expect(response.body.total).toBe(1);
    expect(response.body.items[0].id).toBe(2);
  });
});

describe('variants and stock', () => {
  it('adds stock and removes stock, with ledger and audit rows', async () => {
    const variantId = await getVariantId('TN-TSH1-BLK-M');
    const before = await getStock('TN-TSH1-BLK-M');

    await admin.post('/api/admin/variants/' + variantId + '/stock').send({ delta: 5, note: 'new delivery' });
    await admin.post('/api/admin/variants/' + variantId + '/stock').send({ delta: -2 });

    expect(await getStock('TN-TSH1-BLK-M')).toBe(before + 3);
    const movements = await queryDb('SELECT change_qty FROM inventory_movements WHERE variant_id = $1 ORDER BY id', [variantId]);
    expect(movements).toEqual([{ change_qty: 5 }, { change_qty: -2 }]);
    const audit = await queryDb("SELECT action FROM audit_log WHERE action = 'stock.adjusted'");
    expect(audit).toHaveLength(2);
  });

  it('refuses to take more stock than exists, and changes nothing', async () => {
    const variantId = await getVariantId('TN-TSH1-BLK-XL'); // stock 1
    const response = await admin.post('/api/admin/variants/' + variantId + '/stock').send({ delta: -5 });

    expect(response.status).toBe(409);
    expect(await getStock('TN-TSH1-BLK-XL')).toBe(1);
    expect(await queryDb('SELECT id FROM inventory_movements')).toHaveLength(0);
  });

  it('refuses a change of 0', async () => {
    const response = await admin.post('/api/admin/variants/1/stock').send({ delta: 0 });

    expect(response.status).toBe(400);
  });

  it('adds a variant to a product and edits a variant', async () => {
    const added = await admin.post('/api/admin/products/1/variants').send({ sku: 'TN-TSH1-BLK-XXL', size: 'XXL', color: 'Black', stock_qty: 4 });
    const variantId = await getVariantId('TN-TSH1-BLK-XXL');
    const edited = await admin.patch('/api/admin/variants/' + variantId).send({ color: 'Jet Black' });

    expect(added.status).toBe(201);
    expect(added.body.product.variants).toHaveLength(9);
    expect(edited.body.product.variants.find((v) => v.id === variantId).color).toBe('Jet Black');
  });
});

describe('categories', () => {
  it('creates a category with a slug and refuses a duplicate name', async () => {
    const created = await admin.post('/api/admin/categories').send({ name: 'Rain Jackets' });
    const duplicate = await admin.post('/api/admin/categories').send({ name: 'Rain Jackets' });

    expect(created.status).toBe(201);
    expect(created.body.category.slug).toBe('rain-jackets');
    expect(duplicate.status).toBe(409);
  });

  it('renames a category', async () => {
    const response = await admin.patch('/api/admin/categories/5').send({ name: 'Warm Socks' });
    const list = await admin.get('/api/admin/categories');

    expect(response.body.category.slug).toBe('warm-socks');
    expect(list.body.categories.find((c) => c.id === 5).product_count).toBe(6);
  });
});
