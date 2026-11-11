// SQL only. "db" is the pool or a transaction client.

// Every line of the cart with the product and variant details needed to show and price it.
export async function getCartLines(db, userId) {
  const sql = `
    SELECT ci.variant_id, ci.quantity, v.sku, v.size, v.color, v.stock_qty,
           p.id AS product_id, p.name AS product_name, p.price_cents, p.image_url, p.is_active
    FROM cart_items ci
    JOIN variants v ON v.id = ci.variant_id
    JOIN products p ON p.id = v.product_id
    WHERE ci.user_id = $1
    ORDER BY ci.id
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
}

// A variant together with the "is the product still on sale" flag.
export async function findVariantForCart(db, variantId) {
  const sql = `
    SELECT v.id, v.stock_qty, p.is_active
    FROM variants v
    JOIN products p ON p.id = v.product_id
    WHERE v.id = $1
  `;
  const result = await db.query(sql, [variantId]);
  return result.rows[0] || null;
}

// How many of this variant the user already has in the cart (0 if none).
export async function getCartQuantity(db, userId, variantId) {
  const sql = 'SELECT quantity FROM cart_items WHERE user_id = $1 AND variant_id = $2';
  const result = await db.query(sql, [userId, variantId]);
  return result.rows.length > 0 ? result.rows[0].quantity : 0;
}

// Adds a new line, or replaces the quantity of an existing line.
// UNIQUE (user_id, variant_id) makes sure there is never a second row for the same variant.
export async function saveCartQuantity(db, userId, variantId, quantity) {
  const sql = `
    INSERT INTO cart_items (user_id, variant_id, quantity)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, variant_id) DO UPDATE SET quantity = EXCLUDED.quantity
  `;
  await db.query(sql, [userId, variantId, quantity]);
}

// Returns how many rows were deleted (0 or 1).
export async function deleteCartLine(db, userId, variantId) {
  const sql = 'DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2';
  const result = await db.query(sql, [userId, variantId]);
  return result.rowCount;
}

export async function clearCart(db, userId) {
  await db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
}
