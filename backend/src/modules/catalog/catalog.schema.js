import { z } from 'zod';
import { pageFields } from '../../lib/schemas.js';

// Query string for GET /api/products. Prices are in paise, like everywhere in the API.
export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    category: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().int().min(0).optional(),
    maxPrice: z.coerce.number().int().min(0).optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'name']).default('newest'),
    inStock: z.enum(['true', 'false']).optional(),
    ...pageFields,
  })
  .refine(
    (query) =>
      query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice,
    { message: 'minPrice must not be higher than maxPrice', path: ['minPrice'] }
  );
