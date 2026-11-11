import { pool } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { calculateTotals } from '../../lib/pricing.js';
import { shopConfig } from '../../config/shop.js';
import {
  getCartLines,
  findVariantForCart,
  getCartQuantity,
  saveCartQuantity,
  deleteCartLine,
} from './cart.repo.js';

// The cart with a price for each line and the totals.
export async function getCart(userId) {
  const lines = await getCartLines(pool, userId);

  let subtotal = 0;
  const items = [];
  for (const line of lines) {
    const lineTotal = line.price_cents * line.quantity;
    subtotal = subtotal + lineTotal;
    // "available" is only a hint for the screen. Checkout checks stock again for real.
    const available = line.is_active && line.stock_qty >= line.quantity;
    items.push({ ...line, line_total_cents: lineTotal, available: available });
  }

  const totals = calculateTotals(subtotal);
  return {
    items: items,
    ...totals,
    free_shipping_threshold_cents: shopConfig.freeShippingThresholdCents,
  };
}

// This stock check is advisory: stock can still change before checkout.
// The real protection is the conditional UPDATE inside the checkout transaction.
async function checkCanHold(variantId, newQuantity) {
  const variant = await findVariantForCart(pool, variantId);
  if (!variant || !variant.is_active) {
    throw new AppError(404, 'VARIANT_NOT_FOUND', 'This product is not available');
  }
  if (newQuantity > variant.stock_qty) {
    throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock', { available: variant.stock_qty });
  }
}

export async function addItem(userId, variantId, quantity) {
  const current = await getCartQuantity(pool, userId, variantId);
  const newQuantity = current + quantity;

  if (newQuantity > shopConfig.maxQuantityPerLine) {
    throw new AppError(409, 'QUANTITY_LIMIT', 'You can buy at most ' + shopConfig.maxQuantityPerLine + ' of one item');
  }
  await checkCanHold(variantId, newQuantity);

  await saveCartQuantity(pool, userId, variantId, newQuantity);
  return getCart(userId);
}

export async function updateItem(userId, variantId, quantity) {
  const current = await getCartQuantity(pool, userId, variantId);
  if (current === 0) {
    throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'This item is not in your cart');
  }
  await checkCanHold(variantId, quantity);

  await saveCartQuantity(pool, userId, variantId, quantity);
  return getCart(userId);
}

export async function removeItem(userId, variantId) {
  const deleted = await deleteCartLine(pool, userId, variantId);
  if (deleted === 0) {
    throw new AppError(404, 'CART_ITEM_NOT_FOUND', 'This item is not in your cart');
  }
  return getCart(userId);
}
