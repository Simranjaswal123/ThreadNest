import express from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { variantIdParamSchema } from '../../lib/schemas.js';
import { addItemSchema, updateItemSchema } from './cart.schema.js';
import { getCart, addItem, updateItem, removeItem } from './cart.service.js';

// Mounted at /api/cart. The cart belongs to the logged in user, so every route needs a login.
// The user id always comes from req.user, never from the request.
const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  res.json(await getCart(req.user.id));
});

router.post('/items', async (req, res) => {
  const body = addItemSchema.parse(req.body);
  const cart = await addItem(req.user.id, body.variantId, body.quantity);
  res.status(201).json(cart);
});

router.patch('/items/:variantId', async (req, res) => {
  const params = variantIdParamSchema.parse(req.params);
  const body = updateItemSchema.parse(req.body);
  res.json(await updateItem(req.user.id, params.variantId, body.quantity));
});

router.delete('/items/:variantId', async (req, res) => {
  const params = variantIdParamSchema.parse(req.params);
  res.json(await removeItem(req.user.id, params.variantId));
});

export default router;
