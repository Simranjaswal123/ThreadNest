// SQL only. Changes to variants made by an admin.

export async function findVariantById(db, variantId) {
  const sql = 'SELECT id, product_id, sku, size, color, stock_qty FROM variants WHERE id = $1';
  const result = await db.query(sql, [variantId]);
  return result.rows[0] || null;
}

// Add or remove stock, but never go below zero: "stock_qty + $1 >= 0" is checked by the database
// in the same step. No row back means the stock would have become negative.
export async function changeStockBy(db, variantId, delta) {
  const sql = `
    UPDATE variants SET stock_qty = stock_qty + $1
    WHERE id = $2 AND stock_qty + $1 >= 0
    RETURNING stock_qty
  `;
  const result = await db.query(sql, [delta, variantId]);
  return result.rows.length > 0 ? result.rows[0].stock_qty : null;
}

// Only these columns can be changed. The names come from this list, never from the request.
const changeableColumns = ['sku', 'size', 'color'];

export async function updateVariantColumns(db, variantId, changes) {
  const sets = [];
  const values = [];
  for (const column of changeableColumns) {
    if (changes[column] !== undefined) {
      values.push(changes[column]);
      sets.push(column + ' = $' + values.length);
    }
  }
  values.push(variantId);
  const sql = 'UPDATE variants SET ' + sets.join(', ') + ' WHERE id = $' + values.length;
  await db.query(sql, values);
}
