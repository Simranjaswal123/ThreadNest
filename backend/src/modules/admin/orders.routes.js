import express from 'express';
import { idParamSchema } from '../../lib/schemas.js';
import { adminOrderQuerySchema, statusBodySchema } from './orders.schema.js';
import { getAdminOrders, getAdminOrder, changeOrderStatus } from './orders.service.js';

// Mounted at /api/admin/orders.
const router = express.Router();

router.get('/', async (req, res) => {
  const filters = adminOrderQuerySchema.parse(req.query);
  res.json(await getAdminOrders(filters));
});

router.get('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  res.json({ order: await getAdminOrder(params.id) });
});

router.patch('/:id/status', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const body = statusBodySchema.parse(req.body);
  res.json({ order: await changeOrderStatus(req.user.id, params.id, body.status) });
});

export default router;
