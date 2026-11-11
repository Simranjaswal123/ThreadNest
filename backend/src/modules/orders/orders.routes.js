import express from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { idParamSchema } from '../../lib/schemas.js';
import { payBodySchema } from '../payments/payments.schema.js';
import { payOrder } from '../payments/payments.service.js';
import { checkoutBodySchema, readIdempotencyKey } from './orders.schema.js';
import { placeOrder, getOrder, getOrders, cancelOrder } from './orders.service.js';

// POST /api/checkout
export const checkoutRouter = express.Router();
checkoutRouter.use(authenticate);

checkoutRouter.post('/', async (req, res) => {
  const body = checkoutBodySchema.parse(req.body);
  const key = readIdempotencyKey(req);
  const result = await placeOrder(req.user.id, key, body.addressId);

  // 201 for a new order, 200 when the same checkout was already done.
  res.status(result.created ? 201 : 200).json({ order: result.order });
});

// /api/orders. The user id always comes from req.user, so only own orders are reachable.
export const ordersRouter = express.Router();
ordersRouter.use(authenticate);

ordersRouter.get('/', async (req, res) => {
  res.json({ orders: await getOrders(req.user.id) });
});

ordersRouter.get('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  res.json({ order: await getOrder(req.user.id, params.id) });
});

ordersRouter.post('/:id/pay', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  const body = payBodySchema.parse(req.body);
  res.json(await payOrder(req.user.id, params.id, body.cardNumber));
});

ordersRouter.post('/:id/cancel', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  res.json({ order: await cancelOrder(req.user.id, params.id) });
});
