import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../format.js';

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

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-bold">My orders</h1>
        <p>You have no orders yet. <Link to="/" className="text-indigo-700 underline">Start shopping</Link></p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">My orders</h1>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow">
            <div>
              <Link to={'/orders/' + order.id} className="font-semibold text-indigo-700 underline">Order #{order.id}</Link>
              <p className="text-sm text-slate-600">{formatDate(order.created_at)} · {order.item_count} items</p>
            </div>
            <StatusBadge status={order.status} />
            <p className="font-medium">{formatMoney(order.total_cents)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
