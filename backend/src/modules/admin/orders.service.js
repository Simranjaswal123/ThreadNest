import { pool } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { nextStatuses } from '../../lib/orderStateMachine.js';
import { moveOrder } from '../orders/orderStatus.service.js';
import { listOrderItems, listOrderPayments, listOrderHistory } from '../orders/orders.repo.js';
import { listAdminOrders, countAdminOrders, findAdminOrder } from './orders.repo.js';

// The buttons an admin may show. "paid" is left out: an order becomes paid only through a
// successful payment, so the payments and the order status always agree.
function adminNextStatuses(status) {
  return nextStatuses(status).filter((next) => next !== 'paid');
}

export async function getAdminOrders(filters) {
  const rows = await listAdminOrders(pool, filters);
  const items = rows.map((row) => ({ ...row, next_statuses: adminNextStatuses(row.status) }));
  const total = await countAdminOrders(pool, filters);
  const totalPages = Math.ceil(total / filters.limit);
  return { items: items, total: total, page: filters.page, limit: filters.limit, totalPages: totalPages };
}

export async function getAdminOrder(orderId) {
  const order = await findAdminOrder(pool, orderId);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  order.items = await listOrderItems(pool, orderId);
  order.payments = await listOrderPayments(pool, orderId);
  order.history = await listOrderHistory(pool, orderId);
  order.next_statuses = adminNextStatuses(order.status);
  return order;
}

// The status endpoint reuses the same rules as the customer actions (applyStatusChange).
export async function changeOrderStatus(adminId, orderId, newStatus) {
  if (newStatus === 'paid') {
    throw new AppError(409, 'INVALID_TRANSITION', 'An order becomes paid only through a payment', {
      to: 'paid',
    });
  }
  await moveOrder(orderId, newStatus, adminId);
  return getAdminOrder(orderId);
}
