import { useEffect, useState } from 'react';
import { api, errorText } from '../../api.js';
import Pagination from '../../components/Pagination.jsx';
import { formatDate, formatMoney } from '../../format.js';

export default function AdminCustomersPage() {
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (search) params.set('q', search);
    setLoading(true);
    api
      .get('/admin/customers?' + params.toString())
      .then(setResult)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [search, page]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(text.trim());
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form onSubmit={handleSearch} className="flex max-w-md items-end gap-2">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-medium">Name or email</label>
          <input id="search" value={text} onChange={(e) => setText(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>
        <button type="submit" className="rounded bg-brand-strong px-4 py-2 font-medium text-white hover:bg-brand-deep">Search</button>
      </form>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      {loading && <p role="status">Loading customers...</p>}
      {!loading && result && result.items.length === 0 && <p>No customers found.</p>}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr><th className="p-2">Name</th><th>Email</th><th>Joined</th><th>Orders</th><th>Spent</th></tr>
            </thead>
            <tbody>
              {result.items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2">{c.full_name}</td>
                  <td>{c.email}</td>
                  <td>{formatDate(c.created_at)}</td>
                  <td>{c.order_count}</td>
                  <td>{formatMoney(c.total_spent_cents)}</td>
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
