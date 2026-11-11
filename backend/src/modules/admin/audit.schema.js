import { z } from 'zod';
import { pageFields } from '../../lib/schemas.js';

const dateText = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date format YYYY-MM-DD');

export const auditQuerySchema = z.object({
  action: z.string().trim().max(50).optional(),
  entityType: z.string().trim().max(50).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  from: dateText.optional(),
  to: dateText.optional(),
  ...pageFields,
});
