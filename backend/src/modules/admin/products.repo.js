// SQL only. Admin queries also see products that are not active.
import { createFilter, escapeLike } from '../../lib/sqlFilter.js';

function buildFilter(filters) {
  const filter = createFilter();
  if (filters.q) {
    filter.add('(p.name ILIKE ? OR p.description ILIKE ?)', '%' + escapeLike(filters.q) + '%');
  }
  if (filters.category) {
    filter.add('p.category_id = ?', filters.category);
  }
  if (filters.active) {
    filter.add('p.is_active = ?', filters.active === 'true');
  }
  return filter;
}

export async function listAdminProducts(db, filters) {
  const filter = buildFilter(filters);
  const n = filter.values.length;
  const sql = `
    SELECT p.id, p.name, p.category_id, c.name AS category_name, p.price_cents, p.is_active,
           (SELECT COUNT(*)::int FROM variants v WHERE v.product_id = p.id) AS variant_count,
           (SELECT COALESCE(SUM(v.stock_qty), 0)::int FROM variants v WHERE v.product_id = p.id) AS total_stock
    FROM products p
    JOIN categories c ON c.id = p.category_id
    ${filter.where()}
    ORDER BY p.id
    LIMIT $${n + 1} OFFSET $${n + 2}
  `;
  const offset = (filters.page - 1) * filters.limit;
  const result = await db.query(sql, [...filter.values, filters.limit, offset]);
  return result.rows;
}

export async function countAdminProducts(db, filters) {
  const filter = buildFilter(filters);
  const result = await db.query('SELECT COUNT(*)::int AS total FROM products p ' + filter.where(), filter.values);
  return result.rows[0].total;
}

export async function findAdminProduct(db, id) {
  const sql = `
    SELECT p.id, p.name, p.description, p.image_url, p.price_cents, p.is_active,
           p.category_id, c.name AS category_name
    FROM products p JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

export async function insertProduct(db, p) {
  const sql = `
    INSERT INTO products (category_id, name, description, image_url, price_cents)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  const values = [p.category_id, p.name, p.description || null, p.image_url || null, p.price_cents];
  const result = await db.query(sql, values);
  return result.rows[0].id;
}

// Only these columns can be changed. The names come from this list, never from the request.
const changeableColumns = ['category_id', 'name', 'description', 'image_url', 'price_cents', 'is_active'];

export async function updateProductColumns(db, id, changes) {
  const sets = [];
  const values = [];
  for (const column of changeableColumns) {
    if (changes[column] !== undefined) {
      values.push(changes[column]);
      sets.push(column + ' = $' + values.length);
    }
  }
  values.push(id);
  const sql = 'UPDATE products SET ' + sets.join(', ') + ' WHERE id = $' + values.length + ' RETURNING id';
  const result = await db.query(sql, values);
  return result.rows.length > 0;
}

export async function insertVariant(db, productId, v) {
  const sql = `
    INSERT INTO variants (product_id, sku, size, color, stock_qty)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;
  const result = await db.query(sql, [productId, v.sku, v.size || null, v.color || null, v.stock_qty]);
  return result.rows[0].id;
}
