import { z } from 'zod';
import { shopConfig } from '../../config/shop.js';

const quantity = z.number().int().min(1).max(shopConfig.maxQuantityPerLine);

export const addItemSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: quantity.default(1),
});

export const updateItemSchema = z.object({
  quantity: quantity,
});
