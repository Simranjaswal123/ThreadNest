// SQL only. Card numbers are never stored: a payment row has only the amount and the result.

export async function insertPayment(db, orderId, amountCents, status) {
  const sql = 'INSERT INTO payments (order_id, amount_cents, status) VALUES ($1, $2, $3)';
  await db.query(sql, [orderId, amountCents, status]);
}

// Used when an order is cancelled: a succeeded payment becomes refunded (simulated).
export async function refundSucceededPayments(db, orderId) {
  const sql = "UPDATE payments SET status = 'refunded' WHERE order_id = $1 AND status = 'succeeded'";
  await db.query(sql, [orderId]);
}
