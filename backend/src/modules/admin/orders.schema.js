import { z } from 'zod';
import { pageFields } from '../../lib/schemas.js';
import { ORDER_STATUSES } from '../../lib/orderStateMachine.js';

// A date written like 2026-11-30.
const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD');

export const adminOrderQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  from: dateText.optional(),
  to: dateText.optional(),
  q: z.string().trim().max(100).optional(),
  ...pageFields,
});

export const statusBodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
