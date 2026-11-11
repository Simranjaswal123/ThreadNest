// SQL only. "db" is the pool or a transaction client.

const orderColumns = `id, user_id, shipping_address, status, subtotal_cents, shipping_cents,
                      tax_cents, total_cents, created_at, updated_at`;

// Rule 2: the first insert wins. A second insert with the same (user_id, idempotency_key)
// does nothing and returns no row. The database makes sure of this, even for two requests
// at the same moment.
export async function insertOrder(db, userId, idempotencyKey, addressText, totals) {
  const sql = `
    INSERT INTO orders (user_id, shipping_address, subtotal_cents, shipping_cents,
                        tax_cents, total_cents, idempotency_key)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id, idempotency_key) DO NOTHING
    RETURNING id
  `;
  const values = [
    userId, addressText, totals.subtotal_cents, totals.shipping_cents,
    totals.tax_cents, totals.total_cents, idempotencyKey,
  ];
  const result = await db.query(sql, values);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

export async function findOrderIdByKey(db, userId, idempotencyKey) {
  const sql = 'SELECT id FROM orders WHERE user_id = $1 AND idempotency_key = $2';
  const result = await db.query(sql, [userId, idempotencyKey]);
  return result.rows.length > 0 ? result.rows[0].id : null;
}

// The name, SKU and price are copied (a snapshot), so later catalogue changes never alter old orders.
export async function insertOrderItem(db, orderId, line) {
  const sql = `
    INSERT INTO order_items (order_id, variant_id, product_name, sku, unit_price_cents, quantity)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await db.query(sql, [orderId, line.variant_id, line.product_name, line.sku, line.price_cents, line.quantity]);
}

// Rule 1: take stock only if enough is left. "stock_qty >= $1" is checked by the database in
// the same step as the change, so two buyers can never both take the last item.
// No row back means there was not enough stock.
export async function decreaseStock(db, variantId, quantity) {
  const sql = `
    UPDATE variants SET stock_qty = stock_qty - $1
    WHERE id = $2 AND stock_qty >= $1
    RETURNING id
  `;
  const result = await db.query(sql, [quantity, variantId]);
  return result.rows.length > 0;
}

export async function increaseStock(db, variantId, quantity) {
  await db.query('UPDATE variants SET stock_qty = stock_qty + $1 WHERE id = $2', [quantity, variantId]);
}

// The stock ledger. "change" is negative when stock leaves and positive when it comes back.
export async function insertStockMovement(db, variantId, change, reason, orderId, userId) {
  const sql = `
    INSERT INTO inventory_movements (variant_id, change_qty, reason, order_id, created_by)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await db.query(sql, [variantId, change, reason, orderId, userId]);
}

export async function insertStatusHistory(db, orderId, fromStatus, toStatus, userId) {
  const sql = `
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES ($1, $2, $3, $4)
  `;
  await db.query(sql, [orderId, fromStatus, toStatus, userId]);
}

// Rule 3: the change only happens if the order still has the status we saw ("old").
// If someone else changed it meanwhile, no row matches and we get false.
export async function updateOrderStatus(db, orderId, oldStatus, newStatus) {
  const sql = `
    UPDATE orders SET status = $3, updated_at = NOW()
    WHERE id = $1 AND status = $2
    RETURNING id
  `;
  const result = await db.query(sql, [orderId, oldStatus, newStatus]);
  return result.rows.length > 0;
}

export async function findOrderById(db, orderId) {
  const result = await db.query('SELECT ' + orderColumns + ' FROM orders WHERE id = $1', [orderId]);
  return result.rows[0] || null;
}

// Rule 4: "AND user_id" means somebody else's order is simply not found.
export async function findOrderForUser(db, orderId, userId) {
  const sql = 'SELECT ' + orderColumns + ' FROM orders WHERE id = $1 AND user_id = $2';
  const result = await db.query(sql, [orderId, userId]);
  return result.rows[0] || null;
}

export async function listOrderItems(db, orderId) {
  const sql = `
    SELECT variant_id, product_name, sku, unit_price_cents, quantity
    FROM order_items WHERE order_id = $1 ORDER BY variant_id
  `;
  const result = await db.query(sql, [orderId]);
  return result.rows;
}

export async function listOrderPayments(db, orderId) {
  const sql = 'SELECT id, amount_cents, status, created_at FROM payments WHERE order_id = $1 ORDER BY id';
  const result = await db.query(sql, [orderId]);
  return result.rows;
}

export async function listOrderHistory(db, orderId) {
  const sql = `
    SELECT from_status, to_status, created_at
    FROM order_status_history WHERE order_id = $1 ORDER BY id
  `;
  const result = await db.query(sql, [orderId]);
  return result.rows;
}

export async function listOrdersForUser(db, userId) {
  const sql = `
    SELECT o.id, o.status, o.total_cents, o.created_at,
           (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
    FROM orders o
    WHERE o.user_id = $1
    ORDER BY o.created_at DESC, o.id DESC
  `;
  const result = await db.query(sql, [userId]);
  return result.rows;
}
