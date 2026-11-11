import { z } from 'zod';
import { pageFields } from '../../lib/schemas.js';

// The fields of one variant (a size and colour with its own SKU and stock).
export const variantFields = {
  sku: z.string().trim().min(3).max(50),
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(30).optional(),
};

const newVariantSchema = z.object({
  ...variantFields,
  stock_qty: z.number().int().min(0).default(0),
});

// A new product must come with at least one variant.
export const createProductSchema = z.object({
  category_id: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  image_url: z.string().trim().max(500).optional(),
  price_cents: z.number().int().min(0),
  variants: z.array(newVariantSchema).min(1, 'A product needs at least one variant'),
});

export const updateProductSchema = z
  .object({
    category_id: z.number().int().positive(),
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000),
    image_url: z.string().trim().max(500),
    price_cents: z.number().int().min(0),
    is_active: z.boolean(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field to change' });

export const newVariantBodySchema = newVariantSchema;

export const adminProductQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.coerce.number().int().positive().optional(),
  active: z.enum(['true', 'false']).optional(),
  ...pageFields,
});
