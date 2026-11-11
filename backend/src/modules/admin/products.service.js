import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { recordAudit } from '../audit/audit.service.js';
import { findVariantsOfProduct } from '../catalog/catalog.repo.js';
import { insertStockMovement } from '../orders/orders.repo.js';
import {
  listAdminProducts,
  countAdminProducts,
  findAdminProduct,
  insertProduct,
  updateProductColumns,
  insertVariant,
} from './products.repo.js';

// Turns a database error into a clear API error.
export function translateDbError(error) {
  if (error.code === '23505') {
    return new AppError(409, 'SKU_TAKEN', 'That SKU is already used by another variant');
  }
  if (error.code === '23503') {
    return new AppError(400, 'CATEGORY_NOT_FOUND', 'Category not found');
  }
  return error;
}

export async function getAdminProducts(filters) {
  const items = await listAdminProducts(pool, filters);
  const total = await countAdminProducts(pool, filters);
  const totalPages = Math.ceil(total / filters.limit);
  return { items: items, total: total, page: filters.page, limit: filters.limit, totalPages: totalPages };
}

// One product with all of its variants (also inactive products).
export async function getAdminProduct(db, id) {
  const product = await findAdminProduct(db, id);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  product.variants = await findVariantsOfProduct(db, id);
  return product;
}

// Adds a variant. Starting stock is written to the stock ledger, so the ledger always adds up.
export async function addVariantInTransaction(client, adminId, productId, variant) {
  const variantId = await insertVariant(client, productId, variant);
  if (variant.stock_qty > 0) {
    await insertStockMovement(client, variantId, variant.stock_qty, 'admin_adjustment', null, adminId);
  }
  const details = { product_id: productId, sku: variant.sku, stock_qty: variant.stock_qty };
  await recordAudit(client, adminId, 'variant.created', 'variant', variantId, details);
}

export async function createProduct(adminId, body) {
  try {
    const productId = await runInTransaction(async (client) => {
      const id = await insertProduct(client, body);
      for (const variant of body.variants) {
        await addVariantInTransaction(client, adminId, id, variant);
      }
      const details = { name: body.name, price_cents: body.price_cents, variant_count: body.variants.length };
      await recordAudit(client, adminId, 'product.created', 'product', id, details);
      return id;
    });
    return getAdminProduct(pool, productId);
  } catch (error) {
    throw translateDbError(error);
  }
}

export async function updateProduct(adminId, id, changes) {
  try {
    await runInTransaction(async (client) => {
      const before = await getAdminProduct(client, id);
      await updateProductColumns(client, id, changes);

      // Switching a product off is a different action in the audit log than a normal edit.
      const deactivated = changes.is_active === false && before.is_active === true;
      const action = deactivated ? 'product.deactivated' : 'product.updated';
      await recordAudit(client, adminId, action, 'product', id, { changes: changes });
    });
    return getAdminProduct(pool, id);
  } catch (error) {
    throw translateDbError(error);
  }
}

// Products are deactivated, never deleted, so old orders keep pointing at real rows.
export async function deactivateProduct(adminId, id) {
  return updateProduct(adminId, id, { is_active: false });
}
