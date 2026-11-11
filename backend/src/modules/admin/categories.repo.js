// SQL only.

export async function listAdminCategories(db) {
  const sql = `
    SELECT c.id, c.name, c.slug,
           (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS product_count
    FROM categories c
    ORDER BY c.id
  `;
  const result = await db.query(sql);
  return result.rows;
}

export async function insertCategory(db, name, slug) {
  const sql = 'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug';
  const result = await db.query(sql, [name, slug]);
  return result.rows[0];
}

// Returns null when the category does not exist.
export async function updateCategory(db, id, name, slug) {
  const sql = 'UPDATE categories SET name = $2, slug = $3 WHERE id = $1 RETURNING id, name, slug';
  const result = await db.query(sql, [id, name, slug]);
  return result.rows[0] || null;
}
