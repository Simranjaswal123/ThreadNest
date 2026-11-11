import express from 'express';
import { productQuerySchema } from './catalog.schema.js';
import { idParamSchema } from '../../lib/schemas.js';
import { getCategories, getProducts, getProduct } from './catalog.service.js';

// Public routes: browsing the shop needs no login.
const router = express.Router();

router.get('/categories', async (req, res) => {
  const categories = await getCategories();
  res.json({ categories: categories });
});

router.get('/products', async (req, res) => {
  const filters = productQuerySchema.parse(req.query);
  const result = await getProducts(filters);
  res.json(result);
});

router.get('/products/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const product = await getProduct(params.id);
  res.json({ product: product });
});

export default router;
