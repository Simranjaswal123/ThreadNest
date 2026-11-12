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

  const paid = order.status !== 'placed' && order.status !== 'cancelled';

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="rounded-sm bg-white p-6 shadow-sm">
        {paid ? (
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-2xl text-white">✓</span>
            <div>
              <h1 className="text-2xl font-bold text-green-800">Order placed, thank you!</h1>
              <p className="text-slate-700">Payment approved. Your order number is <b>#{order.id}</b>.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-2xl text-white">!</span>
            <div>
              <h1 className="text-2xl font-bold">Order #{order.id} is saved <StatusBadge status={order.status} /></h1>
              {payment && payment.status === 'failed' ? (
                <p role="alert" className="text-red-800">
                  Payment was not completed: {payment.message}. You can pay again or cancel it on the{' '}
                  <Link to={'/orders/' + order.id} className="text-link underline">order page</Link>.
                </p>
              ) : (
                <p className="text-slate-700">Your order is waiting for payment.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <OrderSummary order={order} />

      <div className="flex flex-wrap gap-3">
        <Link to={'/orders/' + order.id} className="rounded-full bg-cta px-5 py-2 text-sm font-medium text-ink hover:bg-cta-hover">
          View order details
        </Link>
        <Link to="/" className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm hover:bg-slate-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
