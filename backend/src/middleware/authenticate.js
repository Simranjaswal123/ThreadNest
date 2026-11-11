import { pool } from '../db/pool.js';
import { AppError } from '../lib/AppError.js';
import { COOKIE_NAME, verifyToken } from '../lib/token.js';
import { findUserById } from '../modules/auth/auth.repo.js';

// Turns the login cookie into req.user. Without a valid cookie the answer is 401.
export async function authenticate(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in again');
  }

  // Load the user from the database, so deleted users or changed roles are noticed.
  const user = await findUserById(pool, payload.userId);
  if (!user) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Please log in again');
  }

  req.user = user;
  next();
}
