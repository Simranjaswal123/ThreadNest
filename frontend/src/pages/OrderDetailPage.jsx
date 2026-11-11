import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import CardFields from '../components/CardFields.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../format.js';

// Only for showing the cancel button. The server decides for real (rule 3).
const CANCELLABLE = ['placed', 'paid', 'packed'];

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
      <div role="alert">
        <p className="text-red-800">{error}</p>
        <Link to="/orders" className="text-indigo-700 underline">Back to my orders</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/orders" className="text-sm text-indigo-700 underline">Back to my orders</Link>
      <h1 className="text-2xl font-bold">Order #{order.id} <StatusBadge status={order.status} /></h1>
      <p className="text-sm text-slate-600">Placed on {formatDate(order.created_at)}</p>

      <div aria-live="polite">
        {message && <p className="rounded bg-blue-50 p-3 text-blue-900">{message}</p>}
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      </div>

      <OrderSummary order={order} />

      {order.status === 'placed' && (
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Pay for this order</h2>
          <CardFields cardNumber={cardNumber} onChange={setCardNumber} />
          <button onClick={handlePay} disabled={busy}
            className="mt-3 rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {busy ? 'Working...' : 'Pay ' + formatMoney(order.total_cents)}
          </button>
        </section>
      )}

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Payments</h2>
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

      <section className="rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">History</h2>
        <ol className="space-y-1 text-sm">
          {order.history.map((h, index) => (
            <li key={index}>{formatDate(h.created_at)}: {h.from_status ? h.from_status + ' → ' : ''}{h.to_status}</li>
          ))}
        </ol>
      </section>

      {CANCELLABLE.includes(order.status) && (
        <button onClick={handleCancel} disabled={busy}
          className="rounded border border-red-700 px-4 py-2 text-red-800 hover:bg-red-50 disabled:opacity-50">
          Cancel order
        </button>
      )}
    </div>
  );
}
