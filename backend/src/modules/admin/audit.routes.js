import express from 'express';
import { auditQuerySchema } from './audit.schema.js';
import { getAuditPage } from './audit.service.js';

// Mounted at /api/admin/audit.
const router = express.Router();

router.get('/', async (req, res) => {
  const filters = auditQuerySchema.parse(req.query);
  res.json(await getAuditPage(filters));
});

export default router;
