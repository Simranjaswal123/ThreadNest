import express from 'express';
import { idParamSchema } from '../../lib/schemas.js';
import { categorySchema } from './categories.schema.js';
import { getAdminCategories, createCategory, renameCategory } from './categories.service.js';

// Mounted at /api/admin/categories.
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ categories: await getAdminCategories() });
});

router.post('/', async (req, res) => {
  const body = categorySchema.parse(req.body);
  res.status(201).json({ category: await createCategory(req.user.id, body.name) });
});

router.patch('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const body = categorySchema.parse(req.body);
  res.json({ category: await renameCategory(req.user.id, params.id, body.name) });
});

export default router;
