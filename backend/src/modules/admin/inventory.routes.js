import express from 'express';
import { variantIdParamSchema } from '../../lib/schemas.js';
import { updateVariantSchema, stockAdjustmentSchema } from './inventory.schema.js';
import { updateVariant, adjustStock } from './inventory.service.js';

// Mounted at /api/admin/variants. Both routes answer with the whole parent product.
const router = express.Router();

router.patch('/:variantId', async (req, res) => {
  const params = variantIdParamSchema.parse(req.params);
  const changes = updateVariantSchema.parse(req.body);
  res.json({ product: await updateVariant(req.user.id, params.variantId, changes) });
});

router.post('/:variantId/stock', async (req, res) => {
  const params = variantIdParamSchema.parse(req.params);
  const body = stockAdjustmentSchema.parse(req.body);
  res.json({ product: await adjustStock(req.user.id, params.variantId, body.delta, body.note) });
});

export default router;
