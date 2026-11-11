import bcrypt from 'bcryptjs';
import { pool } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { findUserByEmail, createUser } from './auth.repo.js';

export async function registerUser(email, password, fullName) {
  const existing = await findUserByEmail(pool, email);
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    return await createUser(pool, email, passwordHash, fullName);
  } catch (error) {
    // 23505 = unique violation. Two people registering the same email at the same moment.
    if (error.code === '23505') {
      throw new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    }
    throw error;
  }
}

export async function loginUser(email, password) {
  const user = await findUserByEmail(pool, email);

  // Same message for "no such email" and "wrong password", so nobody can find out
  // which emails have an account.
  let passwordOk = false;
  if (user) {
    passwordOk = await bcrypt.compare(password, user.password_hash);
  }
  if (!passwordOk) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Return only safe fields. The hash stays inside this function.
  return { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
}
