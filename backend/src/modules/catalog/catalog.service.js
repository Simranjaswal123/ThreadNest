import { pool } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import {
  listProducts,
  countProducts,
  listCategories,
  findActiveProduct,
  findVariantsOfProduct,
} from './catalog.repo.js';

export async function getCategories() {
  return listCategories(pool);
}

export async function getProducts(filters) {
  const items = await listProducts(pool, filters);
  const total = await countProducts(pool, filters);
  const totalPages = Math.ceil(total / filters.limit);
  return { items: items, total: total, page: filters.page, limit: filters.limit, totalPages: totalPages };
}

export async function getProduct(id) {
  const product = await findActiveProduct(pool, id);
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  }
  product.variants = await findVariantsOfProduct(pool, id);
  return product;
}
