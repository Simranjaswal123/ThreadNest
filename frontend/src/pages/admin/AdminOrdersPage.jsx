import { useEffect, useState } from 'react';
import { api, errorText } from '../../api.js';
import Pagination from '../../components/Pagination.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate, formatMoney } from '../../format.js';

const STATUSES = ['placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];
const inputClass = 'w-full rounded border border-slate-400 px-3 py-2';

export default function AdminOrdersPage() {
  // "form" holds what is typed; "applied" holds what was submitted and is used for the request.
  const emptyFilters = { status: '', from: '', to: '', q: '' };
  const [form, setForm] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    for (const key of Object.keys(applied)) {
      if (applied[key]) params.set(key, applied[key]);
    }
    setLoading(true);
    api
      .get('/admin/orders?' + params.toString())
      .then(setResult)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [applied, page, reloadKey]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleApply(event) {
    event.preventDefault();
    setPage(1);
    setApplied(form);
  }

  async function moveTo(order, status) {
    if (status === 'cancelled' && !window.confirm('Cancel order #' + order.id + '? The stock goes back.')) return;
    setError('');
    setMessage('');
    try {
      await api.patch('/admin/orders/' + order.id + '/status', { status: status });
      setMessage('Order #' + order.id + ' is now ' + status + '.');
      setReloadKey(reloadKey + 1);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>

      <form onSubmit={handleApply} className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange} className={inputClass}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="mb-1 block text-sm font-medium">From</label>
          <input id="from" name="from" type="date" value={form.from} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium">To</label>
          <input id="to" name="to" type="date" value={form.to} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-medium">Order no., name or email</label>
          <input id="q" name="q" value={form.q} onChange={handleChange} className={inputClass} />
        </div>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">Apply</button>
          <button type="button" onClick={() => { setForm(emptyFilters); setApplied(emptyFilters); setPage(1); }}
            className="rounded border border-slate-500 px-4 py-2 hover:bg-slate-100">Reset</button>
        </div>
      </form>

      <div aria-live="polite">
        {message && <p className="rounded bg-green-50 p-3 text-green-900">{message}</p>}
        {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      </div>

      {loading && <p role="status">Loading orders...</p>}
      {!loading && result && result.items.length === 0 && <p>No orders match these filters.</p>}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2">Order</th><th>Date</th><th>Customer</th><th>Items</th>
                <th>Total</th><th>Status</th><th>Move to</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="p-2 font-medium">#{order.id}</td>
                  <td>{formatDate(order.created_at)}</td>
                  <td>{order.customer_name}<br /><span className="text-slate-600">{order.customer_email}</span></td>
                  <td>{order.item_count}</td>
                  <td>{formatMoney(order.total_cents)}</td>
                  <td><StatusBadge status={order.status} /></td>
                  <td>
                    {order.next_statuses.length === 0 && <span className="text-slate-600">Final</span>}
                    <div className="flex flex-wrap gap-1">
                      {order.next_statuses.map((status) => (
                        <button key={status} onClick={() => moveTo(order, status)}
                          className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-100">
                          {status}<span className="sr-only"> order #{order.id}</span>
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && <Pagination page={result.page} totalPages={result.totalPages} onChange={setPage} />}
    </div>
  );
}
