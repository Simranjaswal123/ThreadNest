import express from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { idParamSchema } from '../../lib/schemas.js';
import { addressSchema } from './address.schema.js';
import { getAddresses, createAddress, removeAddress } from './address.service.js';

// Mounted at /api/addresses. Own addresses only: the user id comes from req.user.
const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  res.json({ addresses: await getAddresses(req.user.id) });
});

router.post('/', async (req, res) => {
  const body = addressSchema.parse(req.body);
  const address = await createAddress(req.user.id, body);
  res.status(201).json({ address: address });
});

router.delete('/:id', async (req, res) => {
  const params = idParamSchema.parse(req.params);
  await removeAddress(req.user.id, params.id);
  res.json({ ok: true });
});

export default router;
