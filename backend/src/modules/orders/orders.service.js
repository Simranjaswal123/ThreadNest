import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { calculateTotals } from '../../lib/pricing.js';
import { recordAudit } from '../audit/audit.service.js';
import { findAddressForUser } from '../addresses/address.repo.js';
import { getCartLines, clearCart } from '../cart/cart.repo.js';
import { moveOrder } from './orderStatus.service.js';
import {
  insertOrder,
  findOrderIdByKey,
  insertOrderItem,
  decreaseStock,
  insertStockMovement,
  insertStatusHistory,
  findOrderForUser,
  listOrderItems,
  listOrderPayments,
  listOrderHistory,
  listOrdersForUser,
} from './orders.repo.js';

// The address is copied into the order as text (a snapshot).
function formatAddress(address) {
  const parts = [
    address.full_name,
    address.line1,
    address.line2,
    address.city + ' ' + address.postal_code,
    address.country,
  ];
  if (address.phone) {
    parts.push('Phone: ' + address.phone);
  }
  return parts.filter(Boolean).join('\n');
}

// Adds up the cart. Prices come from the database now, not from the browser.
function priceTheCart(lines) {
  let subtotal = 0;
  for (const line of lines) {
    if (!line.is_active) {
      throw new AppError(409, 'PRODUCT_UNAVAILABLE', line.product_name + ' is no longer available', {
        variantId: line.variant_id,
      });
    }
    subtotal = subtotal + line.price_cents * line.quantity;
  }
  return calculateTotals(subtotal);
}

// Rule 1: take the stock, line by line, in variant_id order. Always the same order, so
// two checkouts can never wait for each other in a circle (a deadlock).
async function takeStockAndAddItems(client, userId, orderId, lines) {
  lines.sort((a, b) => a.variant_id - b.variant_id);

  for (const line of lines) {
    const taken = await decreaseStock(client, line.variant_id, line.quantity);
    if (!taken) {
      // Throwing rolls back everything, including the order row inserted before.
      throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock for ' + line.product_name, {
        variantId: line.variant_id,
        sku: line.sku,
      });
    }
    await insertOrderItem(client, orderId, line);
    await insertStockMovement(client, line.variant_id, -line.quantity, 'order_placed', orderId, userId);
  }
}

// Everything in here runs in ONE transaction. If any step throws, nothing is saved.
async function createOrder(client, userId, idempotencyKey, address) {
  // Read the cart inside the transaction, so the order matches what is really in it.
  const lines = await getCartLines(client, userId);

  if (lines.length === 0) {
    // A repeat of a finished checkout finds an empty cart. Give back the order it made.
    const existingId = await findOrderIdByKey(client, userId, idempotencyKey);
    if (existingId) {
      return { orderId: existingId, created: false };
    }
    throw new AppError(400, 'CART_EMPTY', 'Your cart is empty');
  }

  const totals = priceTheCart(lines);

  // Rule 2: insert the order FIRST. If this key was already used, we get no id back,
  // do nothing else, and return the order that already exists.
  const orderId = await insertOrder(client, userId, idempotencyKey, formatAddress(address), totals);
  if (orderId === null) {
    const existingId = await findOrderIdByKey(client, userId, idempotencyKey);
    return { orderId: existingId, created: false };
  }

  await takeStockAndAddItems(client, userId, orderId, lines);

  await insertStatusHistory(client, orderId, null, 'placed', userId);
  const details = { total_cents: totals.total_cents, line_count: lines.length };
  await recordAudit(client, userId, 'order.placed', 'order', orderId, details);
  await clearCart(client, userId);

  return { orderId: orderId, created: true };
}

// Returns { order, created }. created is false when this checkout had already been done.
export async function placeOrder(userId, idempotencyKey, addressId) {
  const address = await findAddressForUser(pool, addressId, userId);
  if (!address) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
  }

  const result = await runInTransaction((client) => createOrder(client, userId, idempotencyKey, address));
  const order = await getOrder(userId, result.orderId);
  return { order: order, created: result.created };
}

// One order with its items, payments and status history. Only the owner can see it.
export async function getOrder(userId, orderId) {
  const order = await findOrderForUser(pool, orderId, userId);
  if (!order) {
    throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found');
  }
  order.items = await listOrderItems(pool, orderId);
  order.payments = await listOrderPayments(pool, orderId);
  order.history = await listOrderHistory(pool, orderId);
  return order;
}

export async function getOrders(userId) {
  return listOrdersForUser(pool, userId);
}

export async function cancelOrder(userId, orderId) {
  // Make sure the order is the user's own (404 if not) before changing anything.
  await getOrder(userId, orderId);
  await moveOrder(orderId, 'cancelled', userId);
  return getOrder(userId, orderId);
}
