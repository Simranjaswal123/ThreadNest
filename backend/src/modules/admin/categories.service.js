import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { recordAudit } from '../audit/audit.service.js';
import { listAdminCategories, insertCategory, updateCategory } from './categories.repo.js';

// "Tote bags" becomes "tote-bags": lower case, and every run of other characters becomes one dash.
function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function translateDbError(error) {
  // 23505 = unique violation: the name or the slug already exists.
  if (error.code === '23505') {
    return new AppError(409, 'CATEGORY_EXISTS', 'A category with this name already exists');
  }
  return error;
}

export async function getAdminCategories() {
  return listAdminCategories(pool);
}

export async function createCategory(adminId, name) {
  try {
    return await runInTransaction(async (client) => {
      const category = await insertCategory(client, name, makeSlug(name));
      await recordAudit(client, adminId, 'category.created', 'category', category.id, { name: name });
      return category;
    });
  } catch (error) {
    throw translateDbError(error);
  }
}

export async function renameCategory(adminId, id, name) {
  try {
    return await runInTransaction(async (client) => {
      const category = await updateCategory(client, id, name, makeSlug(name));
      if (!category) {
        throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found');
      }
      await recordAudit(client, adminId, 'category.updated', 'category', id, { name: name });
      return category;
    });
  } catch (error) {
    throw translateDbError(error);
  }
}
