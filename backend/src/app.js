import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { pool } from './db/pool.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import addressRoutes from './modules/addresses/address.routes.js';
import { checkoutRouter, ordersRouter } from './modules/orders/orders.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

// app.js only builds the Express app. server.js starts listening.
// Keeping them apart lets the tests use the app without opening a port.
export const app = express();

// Middleware runs top to bottom for every request.

// helmet adds safe HTTP headers. Two changes from its defaults:
// - the shop may run on plain http on localhost, so we do not force https there;
// - product pictures come from the placeholder image site.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
        'img-src': ["'self'", 'data:', 'https://placehold.co'],
      },
    },
    hsts: config.nodeEnv === 'production',
  })
);

// CORS: only the frontend origin from .env may call the API from a browser, with cookies.
app.use(cors({ origin: [config.frontendOrigin], credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', shop: config.shopName, database: 'up' });
  } catch (error) {
    res.status(503).json({ status: 'error', shop: config.shopName, database: 'down' });
  }
});

app.use('/api', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/checkout', checkoutRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRoutes);

// Anything under /api that no route handled is a JSON 404.
app.use('/api', notFoundHandler);

// In production Express also serves the built React app (frontend/dist).
// Every other path returns index.html, so React Router can handle it.
const frontendDist = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
if (config.nodeEnv === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Must stay last: turns every thrown error into the standard JSON error response.
app.use(errorHandler);
