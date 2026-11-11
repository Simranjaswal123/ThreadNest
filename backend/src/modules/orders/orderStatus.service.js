import { runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { canTransition } from '../../lib/orderStateMachine.js';
import { recordAudit } from '../audit/audit.service.js';
import { refundSucceededPayments } from '../payments/payments.repo.js';
import {
  findOrderById,
  updateOrderStatus,
  insertStatusHistory,
  listOrderItems,
  increaseStock,
  insertStockMovement,
} from './orders.repo.js';

// When an order is cancelled, every item goes back on the shelf. Each return is written
// to the stock ledger as a positive movement.
async function putStockBack(client, orderId, actorId) {
  const items = await listOrderItems(client, orderId);
  for (const item of items) {
    await increaseStock(client, item.variant_id, item.quantity);
    await insertStockMovement(client, item.variant_id, item.quantity, 'order_cancelled', orderId, actorId);
  }
}

// The ONE place where an order changes status. Customers (pay, cancel) and admins use it.
// It must be called with a transaction client, so everything below is saved together.
export async function applyStatusChange(client, order, newStatus, actorId) {
  // Rule 3, step 1: is this move allowed at all?
  if (!canTransition(order.status, newStatus)) {
    const message = 'An order that is ' + order.status + ' cannot become ' + newStatus;
    throw new AppError(409, 'INVALID_TRANSITION', message, { from: order.status, to: newStatus });
  }

  // Rule 3, step 2: change it only if the status is still what we saw (UPDATE ... WHERE status = old).
  const changed = await updateOrderStatus(client, order.id, order.status, newStatus);
  if (!changed) {
    throw new AppError(409, 'INVALID_TRANSITION', 'The order status changed in the meantime. Reload and try again.');
  }

  if (newStatus === 'cancelled') {
    await putStockBack(client, order.id, actorId);
    await refundSucceededPayments(client, order.id);
  }

  // Rule 5: history and audit rows are written in the same transaction.
  await insertStatusHistory(client, order.id, order.status, newStatus, actorId);
  const details = { from: order.status, to: newStatus };
  await recordAudit(client, actorId, 'order.' + newStatus, 'order', order.id, details);
}

// Loads an order and moves it, all in one transaction. Access checks are done by the caller.
export async function moveOrder(orderId, newStatus, actorId) {
  await runInTransaction(async (client) => {
    const order = await findOrderById(client, orderId);
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
    }
    await applyStatusChange(client, order, newStatus, actorId);
  });
}
