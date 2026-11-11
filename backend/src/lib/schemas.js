import { z } from 'zod';

// Zod pieces used by several modules.

// A route like /products/:id. The id arrives as text, so we turn it into a whole number.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// A route like /cart/items/:variantId.
export const variantIdParamSchema = z.object({
  variantId: z.coerce.number().int().positive(),
});

// Page number and page size for lists.
export const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};
