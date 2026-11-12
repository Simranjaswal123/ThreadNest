import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import CardFields from '../components/CardFields.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../format.js';

// Only for showing the cancel button. The server decides for real (rule 3).
const CANCELLABLE = ['placed', 'paid', 'packed'];
// The steps of a normal order, for the progress tracker.
const STEPS = ['placed', 'paid', 'packed', 'shipped', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/orders/' + id)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.status === 404 ? 'This order was not found.' : errorText(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePay() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const data = await api.post('/orders/' + id + '/pay', { cardNumber: cardNumber });
      setOrder(data.order);
      setMessage(data.payment.status === 'succeeded' ? 'Payment approved.' : 'Payment declined: ' + data.payment.message);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this order?')) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const data = await api.post('/orders/' + id + '/cancel');
      setOrder(data.order);
      setMessage('The order was cancelled.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Loading order...</p>;
  if (!order) {
    return (
      <div role="alert" className="rounded-sm bg-white p-6">
        <p className="text-red-800">{error}</p>
        <Link to="/orders" className="text-link underline">Back to your orders</Link>
      </div>
    );
  }

  const reachedStep = STEPS.indexOf(order.status);

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link to="/orders" className="hover:underline">Your Orders</Link> <span aria-hidden="true">/</span>{' '}
        <span className="text-slate-900">Order #{order.id}</span>
      </nav>

      <div className="rounded-sm bg-white p-4 shadow-sm lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Order #{order.id} <StatusBadge status={order.status} /></h1>
          <p className="text-sm text-slate-600">Placed on {formatDate(order.created_at)}</p>
        </div>

        {order.status === 'cancelled' ? (
          <p className="mt-4 rounded bg-red-50 p-3 text-red-900">This order was cancelled. The stock was put back and a paid amount was refunded.</p>
        ) : (
          <ol className="mt-5 grid grid-cols-5 gap-1 text-center text-xs" aria-label="Order progress">
            {STEPS.map((step, index) => (
              <li key={step} aria-current={index === reachedStep ? 'step' : undefined}>
                <div className={'h-2 rounded-full ' + (index <= reachedStep ? 'bg-green-600' : 'bg-slate-200')} />
                <span className={'mt-1 block capitalize ' + (index <= reachedStep ? 'font-bold text-green-800' : 'text-slate-500')}>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div aria-live="polite">
        {message && <p className="rounded bg-blue-50 p-3 text-blue-900">{message}</p>}
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      </div>

      {order.status === 'placed' && (
        <section className="rounded-sm border-l-4 border-cta bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-bold">This order is waiting for payment</h2>
          <CardFields cardNumber={cardNumber} onChange={setCardNumber} />
          <button onClick={handlePay} disabled={busy}
            className="mt-3 rounded-full bg-cta px-6 py-2 text-sm font-medium text-ink hover:bg-cta-hover disabled:opacity-50">
            {busy ? 'Working...' : 'Pay ' + formatMoney(order.total_cents)}
          </button>
        </section>
      )}

      <OrderSummary order={order} />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-sm bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Payments</h2>
          {order.payments.length === 0 ? (
            <p className="text-sm text-slate-600">No payment yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {order.payments.map((p) => (
                <li key={p.id}>{formatDate(p.created_at)}: {formatMoney(p.amount_cents)} <StatusBadge status={p.status} /></li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-sm bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">History</h2>
          <ol className="space-y-1 text-sm">
            {order.history.map((h, index) => (
              <li key={index}>{formatDate(h.created_at)}: {h.from_status ? h.from_status + ' → ' : ''}<b>{h.to_status}</b></li>
            ))}
          </ol>
        </section>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <button onClick={handleCancel} disabled={busy}
          className="rounded-full border border-red-700 bg-white px-5 py-2 text-sm text-red-800 hover:bg-red-50 disabled:opacity-50">
          Cancel order
        </button>
      )}
    </div>
  );
}
