import express from 'express';
import { getSummary } from './reports.service.js';

// Mounted at /api/admin/reports.
const router = express.Router();

router.get('/summary', async (req, res) => {
  res.json(await getSummary());
});

export default router;
