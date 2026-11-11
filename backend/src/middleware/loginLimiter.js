import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { AppError } from '../lib/AppError.js';

// Slows down password guessing: one IP gets a limited number of login tries per 15 minutes.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  // Use our normal error format for the 429 response.
  handler: (req, res, next) => {
    next(new AppError(429, 'TOO_MANY_REQUESTS', 'Too many login attempts. Try again later.'));
  },
});
