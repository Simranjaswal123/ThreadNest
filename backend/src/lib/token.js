import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// The login token lives in an httpOnly cookie, so JavaScript in the browser cannot read it.
export const COOKIE_NAME = 'token';

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  // In production the cookie is only sent over https.
  secure: config.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// The token holds only the user id. The role is read from the database on each request,
// so a role change takes effect at once.
export function signToken(userId) {
  return jwt.sign({ userId: userId }, config.jwtSecret, { expiresIn: '7d' });
}

// Throws if the token is wrong, changed or expired.
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
