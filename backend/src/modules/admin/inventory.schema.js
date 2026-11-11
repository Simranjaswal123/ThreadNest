import { z } from 'zod';
import { variantFields } from './products.schema.js';

// Edit a variant's SKU, size or colour. Stock is changed only through the stock adjustment,
// so every stock change is written to the ledger.
export const updateVariantSchema = z
  .object({
    sku: variantFields.sku,
    size: z.string().trim().max(20),
    color: z.string().trim().max(30),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field to change' });

// delta is how much to add (positive) or remove (negative). Zero would change nothing.
export const stockAdjustmentSchema = z.object({
  delta: z.number().int().refine((value) => value !== 0, { message: 'The change must not be 0' }),
  note: z.string().trim().max(200).optional(),
});
