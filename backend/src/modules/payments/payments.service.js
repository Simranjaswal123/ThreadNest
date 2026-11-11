import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { findOrderForUser } from '../orders/orders.repo.js';
import { applyStatusChange } from '../orders/orderStatus.service.js';
import { getOrder } from '../orders/orders.service.js';
import { insertPayment } from './payments.repo.js';
import { chargeCard } from './mockGateway.js';

// Pays for an order with the simulated gateway.
// Declined card: a "failed" payment row is saved and the order stays "placed".
// Good card: a "succeeded" payment row is saved and the order becomes "paid", together.
export async function payOrder(userId, orderId, cardNumber) {
  const order = await findOrderForUser(pool, orderId, userId);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  if (order.status !== 'placed') {
    throw new AppError(409, 'INVALID_TRANSITION', 'Only an order that is placed can be paid', {
      from: order.status,
      to: 'paid',
    });
  }

  const outcome = chargeCard(cardNumber);

  await runInTransaction(async (client) => {
    if (!outcome.approved) {
      await insertPayment(client, orderId, order.total_cents, 'failed');
      return;
    }
    await insertPayment(client, orderId, order.total_cents, 'succeeded');
    // If someone cancelled the order at the same moment, this throws 409 and the
    // payment row above is rolled back too.
    await applyStatusChange(client, order, 'paid', userId);
  });

  const updatedOrder = await getOrder(userId, orderId);
  const payment = { status: outcome.approved ? 'succeeded' : 'failed', message: outcome.message };
  return { order: updatedOrder, payment: payment };
}
