import { useEffect, useState } from 'react';
import { api, errorText } from '../../api.js';
import Pagination from '../../components/Pagination.jsx';
import { formatDate } from '../../format.js';

const inputClass = 'w-full rounded border border-slate-400 px-3 py-2';

export default function AdminAuditPage() {
  const emptyFilters = { action: '', entityType: '', from: '', to: '' };
  const [form, setForm] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '15' });
    for (const key of Object.keys(applied)) {
      if (applied[key]) params.set(key, applied[key]);
    }
    setLoading(true);
    api
      .get('/admin/audit?' + params.toString())
      .then(setResult)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [applied, page]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleApply(event) {
    event.preventDefault();
    setPage(1);
    setApplied(form);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-sm text-slate-600">Every admin and order action is written here, newest first.</p>

      <form onSubmit={handleApply} className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="action" className="mb-1 block text-sm font-medium">Action starts with</label>
          <input id="action" name="action" placeholder="order or product" value={form.action} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label htmlFor="entityType" className="mb-1 block text-sm font-medium">Record type</label>
          <select id="entityType" name="entityType" value={form.entityType} onChange={handleChange} className={inputClass}>
            <option value="">All</option>
            <option value="order">order</option>
            <option value="product">product</option>
            <option value="variant">variant</option>
            <option value="category">category</option>
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
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded bg-brand-strong px-4 py-2 font-medium text-white hover:bg-brand-deep">Apply</button>
          <button type="button" onClick={() => { setForm(emptyFilters); setApplied(emptyFilters); setPage(1); }}
            className="rounded border border-slate-500 px-4 py-2 hover:bg-slate-100">Reset</button>
        </div>
      </form>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      {loading && <p role="status">Loading the audit log...</p>}
      {!loading && result && result.items.length === 0 && <p>No audit rows match these filters.</p>}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr><th className="p-2">When</th><th>Who</th><th>Action</th><th>Record</th><th>Details</th></tr>
            </thead>
            <tbody>
              {result.items.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="p-2">{formatDate(row.created_at)}</td>
                  <td>{row.user_email}</td>
                  <td className="font-medium">{row.action}</td>
                  <td>{row.entity_type} #{row.entity_id}</td>
                  <td className="max-w-xs break-words text-slate-700">{row.details ? JSON.stringify(row.details) : ''}</td>
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
