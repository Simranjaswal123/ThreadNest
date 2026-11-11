import { pool } from '../../db/pool.js';
import { ORDER_STATUSES } from '../../lib/orderStateMachine.js';
import {
  getRevenueTotals,
  getOrderCount,
  getOrdersByStatus,
  getSalesPerDay,
  getTopProducts,
  getLowStock,
} from './reports.repo.js';

// The database returns big sums as text, so we turn them back into numbers.
function toNumber(value) {
  return Number(value);
}

export async function getSummary() {
  const revenue = await getRevenueTotals(pool);
  const orderCount = await getOrderCount(pool);
  const statusRows = await getOrdersByStatus(pool);
  const days = await getSalesPerDay(pool);
  const topProducts = await getTopProducts(pool);
  const lowStock = await getLowStock(pool);

  // Every status is listed, also the ones with 0 orders.
  const ordersByStatus = {};
  for (const status of ORDER_STATUSES) {
    ordersByStatus[status] = 0;
  }
  for (const row of statusRows) {
    ordersByStatus[row.status] = row.total;
  }

  return {
    revenue_cents: toNumber(revenue.revenue_cents),
    revenue_order_count: revenue.revenue_order_count,
    order_count: orderCount,
    orders_by_status: ordersByStatus,
    sales_per_day: days.map((d) => ({ ...d, revenue_cents: toNumber(d.revenue_cents) })),
    top_products: topProducts.map((p) => ({ ...p, revenue_cents: toNumber(p.revenue_cents) })),
    low_stock: lowStock,
  };
}
