import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from '../../config/env.js';
import { pool, runInTransaction } from '../../db/pool.js';
import { AppError } from '../../lib/AppError.js';
import { sendPasswordResetEmail } from '../../lib/mailer.js';
import { recordAudit } from '../audit/audit.service.js';
import {
  findUserByEmail,
  createUser,
  insertResetToken,
  useResetToken,
  cancelResetTokens,
  updatePassword,
} from './auth.repo.js';

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

// ----- Forgot password -----

// The database keeps only this hash of the token, never the token itself.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Sends a reset link if the email has an account. The caller always answers the same way,
// so nobody can use this form to find out which emails are registered.
export async function requestPasswordReset(email) {
  const user = await findUserByEmail(pool, email);
  if (!user) {
    return;
  }

  // 32 random bytes: impossible to guess.
  const token = crypto.randomBytes(32).toString('hex');
  await runInTransaction(async (client) => {
    // Asking for a new link switches off any older one.
    await cancelResetTokens(client, user.id);
    await insertResetToken(client, user.id, hashToken(token));
  });

  const link = config.frontendOrigin + '/reset-password?token=' + token;
  sendPasswordResetEmail(user.email, link);
}

// Sets a new password with the token from the link. The token works only once.
export async function resetPassword(token, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await runInTransaction(async (client) => {
    const userId = await useResetToken(client, hashToken(token));
    if (!userId) {
      throw new AppError(400, 'INVALID_RESET_LINK', 'This reset link is invalid or has expired. Please ask for a new one.');
    }
    await updatePassword(client, userId, passwordHash);
    await cancelResetTokens(client, userId);
    await recordAudit(client, userId, 'user.password_reset', 'user', userId, null);
  });
}
