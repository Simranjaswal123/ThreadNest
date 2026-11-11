import express from 'express';
import { idParamSchema } from '../../lib/schemas.js';
import {
  adminProductQuerySchema,
  createProductSchema,
  updateProductSchema,
  newVariantBodySchema,
} from './products.schema.js';
import { getAdminProducts, getAdminProduct, createProduct, updateProduct, deactivateProduct } from './products.service.js';
import { addVariant } from './inventory.service.js';
import { pool } from '../../db/pool.js';

// Mounted at /api/admin/products. The login and admin checks are done once, on the admin router.
const router = express.Router();

router.get('/', async (req, res) => {
  const filters = adminProductQuerySchema.parse(req.query);
  res.json(await getAdminProducts(filters));
});

router.post('/', async (req, res) => {
  const body = createProductSchema.parse(req.body);
  const product = await createProduct(req.user.id, body);
  res.status(201).json({ product: product });
});

router.get('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  res.json({ product: await getAdminProduct(pool, params.id) });
});

router.patch('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const changes = updateProductSchema.parse(req.body);
  res.json({ product: await updateProduct(req.user.id, params.id, changes) });
});

// "Delete" only switches the product off (is_active = false).
router.delete('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  res.json({ product: await deactivateProduct(req.user.id, params.id) });
});

router.post('/:id/variants', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const body = newVariantBodySchema.parse(req.body);
  const product = await addVariant(req.user.id, params.id, body);
  res.status(201).json({ product: product });
});

export default router;
