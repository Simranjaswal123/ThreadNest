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

// app.js only builds the Express app. server.js starts listening.
// Keeping them apart lets the tests use the app without opening a port.
export const app = express();

// Middleware runs top to bottom for every request.
app.use(helmet());
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

// These two must stay last: first "no route matched", then "something went wrong".
app.use('/api', notFoundHandler);
app.use(errorHandler);
