import { useEffect, useState } from 'react';
import { api, errorText } from '../../api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatMoney } from '../../format.js';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/reports/summary')
      .then(setSummary)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p role="status">Loading the dashboard...</p>;
  if (error) return <p role="alert" className="text-red-800">{error}</p>;

  const biggestDay = Math.max(...summary.sales_per_day.map((day) => day.revenue_cents), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <dt className="text-sm text-slate-600">Revenue (paid orders)</dt>
          <dd className="text-2xl font-bold">{formatMoney(summary.revenue_cents)}</dd>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <dt className="text-sm text-slate-600">Paid orders</dt>
          <dd className="text-2xl font-bold">{summary.revenue_order_count}</dd>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <dt className="text-sm text-slate-600">All orders</dt>
          <dd className="text-2xl font-bold">{summary.order_count}</dd>
        </div>
      </dl>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Orders by status</h2>
        <ul className="flex flex-wrap gap-4">
          {Object.entries(summary.orders_by_status).map(([status, total]) => (
            <li key={status}><StatusBadge status={status} /> {total}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">Sales in the last 14 days</h2>
        <ul className="flex h-40 items-end gap-1">
          {summary.sales_per_day.map((day) => {
            const label = day.day + ': ' + formatMoney(day.revenue_cents) + ' from ' + day.order_count + ' orders';
            const height = Math.round((day.revenue_cents / biggestDay) * 100);
            return (
              <li key={day.day} className="flex h-full flex-1 flex-col justify-end" role="img" aria-label={label} title={label}>
                <div className="rounded-t bg-brand" style={{ height: Math.max(height, 2) + '%' }} />
                <span className="mt-1 text-center text-xs text-slate-700">{day.day.slice(8)}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Top products</h2>
          {summary.top_products.length === 0 ? (
            <p className="text-sm text-slate-600">No sales yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead><tr><th className="py-1">Product</th><th>Units</th><th>Sales</th></tr></thead>
              <tbody>
                {summary.top_products.map((p) => (
                  <tr key={p.product_name} className="border-t">
                    <td className="py-1">{p.product_name}</td><td>{p.units_sold}</td><td>{formatMoney(p.revenue_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Low stock (5 or fewer)</h2>
          {summary.low_stock.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing is running low.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead><tr><th className="py-1">Variant</th><th>SKU</th><th>Left</th></tr></thead>
              <tbody>
                {summary.low_stock.map((v) => (
                  <tr key={v.variant_id} className="border-t">
                    <td className="py-1">{v.product_name}</td><td>{v.sku}</td>
                    <td className={v.stock_qty === 0 ? 'font-bold text-red-700' : ''}>{v.stock_qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
