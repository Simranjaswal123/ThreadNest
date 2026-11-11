import { pool } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { listAddresses, insertAddress, deleteAddress } from './address.repo.js';

export async function getAddresses(userId) {
  return listAddresses(pool, userId);
}

export async function createAddress(userId, data) {
  return insertAddress(pool, userId, data);
}

// Someone else's address looks exactly like a missing one: 404, not 403.
// That way nobody can find out which address ids exist.
export async function removeAddress(userId, addressId) {
  const deleted = await deleteAddress(pool, addressId, userId);
  if (deleted === 0) {
    throw new AppError(404, 'ADDRESS_NOT_FOUND', 'Address not found');
  }
}
