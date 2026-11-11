import express from 'express';
import { customerQuerySchema } from './customers.schema.js';
import { getCustomers } from './customers.service.js';

// Mounted at /api/admin/customers. The list never includes password hashes.
const router = express.Router();

router.get('/', async (req, res) => {
  const filters = customerQuerySchema.parse(req.query);
  res.json(await getCustomers(filters));
});

export default router;
