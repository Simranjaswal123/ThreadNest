import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { recordAudit } from '../audit/audit.service.js';
import { insertStockMovement } from '../orders/orders.repo.js';
import { findVariantById, changeStockBy, updateVariantColumns } from './inventory.repo.js';
import { getAdminProduct, addVariantInTransaction, translateDbError } from './products.service.js';

async function loadVariant(db, variantId) {
  const variant = await findVariantById(db, variantId);
  if (!variant) {
    throw new AppError(404, 'VARIANT_NOT_FOUND', 'Variant not found');
  }
  return variant;
}

export async function addVariant(adminId, productId, variant) {
  try {
    await runInTransaction(async (client) => {
      await getAdminProduct(client, productId);
      await addVariantInTransaction(client, adminId, productId, variant);
    });
    return getAdminProduct(pool, productId);
  } catch (error) {
    throw translateDbError(error);
  }
}

export async function updateVariant(adminId, variantId, changes) {
  let productId;
  try {
    await runInTransaction(async (client) => {
      const variant = await loadVariant(client, variantId);
      productId = variant.product_id;
      await updateVariantColumns(client, variantId, changes);
      await recordAudit(client, adminId, 'variant.updated', 'variant', variantId, { changes: changes });
    });
    return getAdminProduct(pool, productId);
  } catch (error) {
    throw translateDbError(error);
  }
}

// Rule 5 and the stock ledger: the new stock, the ledger row and the audit row are saved together.
export async function adjustStock(adminId, variantId, delta, note) {
  let productId;
  await runInTransaction(async (client) => {
    const variant = await loadVariant(client, variantId);
    productId = variant.product_id;

    const newQuantity = await changeStockBy(client, variantId, delta);
    if (newQuantity === null) {
      throw new AppError(409, 'OUT_OF_STOCK', 'Stock cannot go below zero', { available: variant.stock_qty });
    }
    await insertStockMovement(client, variantId, delta, 'admin_adjustment', null, adminId);

    const details = { sku: variant.sku, delta: delta, new_quantity: newQuantity, note: note || null };
    await recordAudit(client, adminId, 'stock.adjusted', 'variant', variantId, details);
  });
  return getAdminProduct(pool, productId);
}
