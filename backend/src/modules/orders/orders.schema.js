import { z } from 'zod';
import { AppError } from '../../lib/AppError.js';

export const checkoutBodySchema = z.object({
  addressId: z.number().int().positive(),
});

// The Idempotency-Key header: one random value per checkout page visit.
export function readIdempotencyKey(req) {
  const key = req.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The Idempotency-Key header is required (8 to 100 characters)');
  }
  return key;
}
