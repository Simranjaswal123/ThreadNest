import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../format.js';

// A short sentence for each status, shown under the order header.
const statusText = {
  placed: 'Waiting for payment',
  paid: 'Payment received, we are getting it ready',
  packed: 'Packed and ready to ship',
  shipped: 'On the way to you',
  delivered: 'Delivered',
  cancelled: 'Cancelled and refunded if it was paid',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders')
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p role="status">Loading your orders...</p>;
  if (error) return <p role="alert" className="text-red-800">{error}</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-4 text-3xl font-normal">Your Orders</h1>

      {orders.length === 0 && (
        <div className="rounded-sm bg-white p-8 text-center">
          <p>You have not placed any orders yet.</p>
          <Link to="/" className="mt-3 inline-block text-link underline hover:text-link-hover">Start shopping</Link>
        </div>
      )}

      <ul className="space-y-4">
        {orders.map((order) => (
          <li key={order.id} className="overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-slate-300 bg-slate-100 px-4 py-3 text-xs uppercase text-slate-600">
              <div>
                <p>Order placed</p>
                <p className="text-sm normal-case text-slate-900">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p>Total</p>
                <p className="text-sm normal-case text-slate-900">{formatMoney(order.total_cents)}</p>
              </div>
              <div>
                <p>Items</p>
                <p className="text-sm normal-case text-slate-900">{order.item_count}</p>
              </div>
              <div className="ml-auto text-right">
                <p>Order # {order.id}</p>
                <Link to={'/orders/' + order.id} className="text-sm normal-case text-link hover:text-link-hover hover:underline">
                  View order details
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <StatusBadge status={order.status} />
                <p className="mt-1 text-lg font-bold text-slate-900">{statusText[order.status]}</p>
              </div>
              <Link to={'/orders/' + order.id}
                className="rounded-full border border-slate-300 bg-white px-5 py-1.5 text-sm shadow-sm hover:bg-slate-50">
                Order details<span className="sr-only"> for order {order.id}</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
