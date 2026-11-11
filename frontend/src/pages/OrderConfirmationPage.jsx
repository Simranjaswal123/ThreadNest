import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import OrderSummary from '../components/OrderSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // The checkout page tells us how the payment went (approved or declined).
  const payment = location.state ? location.state.payment : null;

  useEffect(() => {
    api
      .get('/orders/' + id)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p role="status">Loading your order...</p>;
  if (error) return <p role="alert" className="text-red-800">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Order #{order.id} <StatusBadge status={order.status} /></h1>

      <div aria-live="polite">
        {payment && payment.status === 'succeeded' && (
          <p className="rounded bg-green-50 p-3 text-green-900">Payment approved. Thank you for your order!</p>
        )}
        {payment && payment.status === 'failed' && (
          <p role="alert" className="rounded bg-red-50 p-3 text-red-900">
            Payment was not completed: {payment.message}. Your order is saved. You can pay again or cancel it on the{' '}
            <Link to={'/orders/' + order.id} className="underline">order page</Link>.
          </p>
        )}
        {!payment && order.status === 'placed' && (
          <p className="rounded bg-amber-50 p-3 text-amber-900">Your order is placed and waiting for payment.</p>
        )}
      </div>

      <OrderSummary order={order} />

      <p className="flex gap-4">
        <Link to={'/orders/' + order.id} className="text-indigo-700 underline">View order details</Link>
        <Link to="/" className="text-indigo-700 underline">Continue shopping</Link>
      </p>
    </div>
  );
}
