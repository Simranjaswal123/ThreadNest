import express from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import productsRoutes from './products.routes.js';
import inventoryRoutes from './inventory.routes.js';
import categoriesRoutes from './categories.routes.js';
import ordersRoutes from './orders.routes.js';
import customersRoutes from './customers.routes.js';
import reportsRoutes from './reports.routes.js';
import auditRoutes from './audit.routes.js';

// Mounted at /api/admin.
const router = express.Router();

// Rule 4: these two lines protect EVERY admin route below, including routes added later.
// First "who are you" (401 if not logged in), then "are you an admin" (403 if not).
router.use(authenticate);
router.use(requireRole('admin'));

router.use('/products', productsRoutes);
router.use('/variants', inventoryRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/customers', customersRoutes);
router.use('/reports', reportsRoutes);
router.use('/audit', auditRoutes);

export default router;
