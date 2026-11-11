// SQL only. Every value from the user goes in as a parameter ($1, $2, ...), never into the text.

// The user picks a sort name; we map it to a fixed piece of SQL from this list.
const sortSql = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price_cents ASC, p.id ASC',
  price_desc: 'p.price_cents DESC, p.id ASC',
  name: 'p.name ASC',
};

// % and _ are wildcards in LIKE. Escape them so a search for "50%" means exactly that.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&');
}

// Builds the WHERE part and its parameter values from the filters.
function buildWhere(filters) {
  const conditions = ['p.is_active = TRUE'];
  const values = [];

  if (filters.q) {
    values.push('%' + escapeLike(filters.q) + '%');
    const n = '$' + values.length;
    conditions.push('(p.name ILIKE ' + n + ' OR p.description ILIKE ' + n + ' OR c.name ILIKE ' + n + ')');
  }
  if (filters.category) {
    values.push(filters.category);
    conditions.push('p.category_id = $' + values.length);
  }
  if (filters.minPrice !== undefined) {
    values.push(filters.minPrice);
    conditions.push('p.price_cents >= $' + values.length);
  }
  if (filters.maxPrice !== undefined) {
    values.push(filters.maxPrice);
    conditions.push('p.price_cents <= $' + values.length);
  }
  if (filters.inStock === 'true') {
    conditions.push('EXISTS (SELECT 1 FROM variants v WHERE v.product_id = p.id AND v.stock_qty > 0)');
  }

  return { whereSql: conditions.join(' AND '), values: values };
}

export async function listProducts(db, filters) {
  const { whereSql, values } = buildWhere(filters);
  const limitPlace = '$' + (values.length + 1);
  const offsetPlace = '$' + (values.length + 2);
  const sql = `
    SELECT p.id, p.name, p.image_url, p.price_cents, p.category_id, c.name AS category_name,
           (SELECT COALESCE(SUM(v.stock_qty), 0)::int FROM variants v WHERE v.product_id = p.id) AS total_stock
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${whereSql}
    ORDER BY ${sortSql[filters.sort]}
    LIMIT ${limitPlace} OFFSET ${offsetPlace}
  `;
  const offset = (filters.page - 1) * filters.limit;
  const result = await db.query(sql, [...values, filters.limit, offset]);
  return result.rows;
}

export async function countProducts(db, filters) {
  const { whereSql, values } = buildWhere(filters);
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE ${whereSql}
  `;
  const result = await db.query(sql, values);
  return result.rows[0].total;
}

export async function listCategories(db) {
  const result = await db.query('SELECT id, name, slug FROM categories ORDER BY id');
  return result.rows;
}

// Only active products are visible to customers.
export async function findActiveProduct(db, id) {
  const sql = `
    SELECT p.id, p.name, p.description, p.image_url, p.price_cents, p.category_id, c.name AS category_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1 AND p.is_active = TRUE
  `;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

export async function findVariantsOfProduct(db, productId) {
  const sql = 'SELECT id, sku, size, color, stock_qty FROM variants WHERE product_id = $1 ORDER BY id';
  const result = await db.query(sql, [productId]);
  return result.rows;
}
