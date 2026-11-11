import { z } from 'zod';
import { pageFields } from '../../lib/schemas.js';

export const customerQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  ...pageFields,
});
