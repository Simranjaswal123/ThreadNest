import { useEffect, useState } from 'react';
import { api, errorText } from '../../api.js';
import Pagination from '../../components/Pagination.jsx';
import { formatMoney } from '../../format.js';

const inputClass = 'w-full rounded border border-slate-400 px-3 py-2';
const buttonClass = 'rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50';

// People type rupees; the API wants paise.
function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

// ---------- The form that creates a new product ----------
function CreateProductForm({ categories, onCreated }) {
  const [form, setForm] = useState({
    category_id: '', name: '', description: '', price: '', sku: '', size: '', color: '', stock_qty: '0',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        category_id: Number(form.category_id),
        name: form.name,
        description: form.description,
        price_cents: toPaise(form.price),
        // A new product starts with one variant. More can be added afterwards.
        variants: [{ sku: form.sku, size: form.size, color: form.color, stock_qty: Number(form.stock_qty) }],
      };
      const data = await api.post('/admin/products', body);
      onCreated(data.product.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">New product</h2>
      <div>
        <label htmlFor="new-category" className="mb-1 block text-sm font-medium">Category</label>
        <select id="new-category" name="category_id" required value={form.category_id} onChange={handleChange} className={inputClass}>
          <option value="">Choose...</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="new-name" className="mb-1 block text-sm font-medium">Name</label>
        <input id="new-name" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="new-description" className="mb-1 block text-sm font-medium">Description</label>
        <input id="new-description" name="description" value={form.description} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-price" className="mb-1 block text-sm font-medium">Price (₹)</label>
        <input id="new-price" name="price" type="number" min="0" step="0.01" required value={form.price} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-sku" className="mb-1 block text-sm font-medium">First variant SKU</label>
        <input id="new-sku" name="sku" required minLength={3} value={form.sku} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-size" className="mb-1 block text-sm font-medium">Size (optional)</label>
        <input id="new-size" name="size" value={form.size} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-color" className="mb-1 block text-sm font-medium">Colour (optional)</label>
        <input id="new-color" name="color" value={form.color} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-stock" className="mb-1 block text-sm font-medium">Starting stock</label>
        <input id="new-stock" name="stock_qty" type="number" min="0" required value={form.stock_qty} onChange={handleChange} className={inputClass} />
      </div>
      <div className="sm:col-span-2" aria-live="polite">
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className={buttonClass}>{saving ? 'Saving...' : 'Create product'}</button>
      </div>
    </form>
  );
}

// ---------- The panel that edits one product, its variants and its stock ----------
function ProductEditor({ id, categories, onChanged, onClose }) {
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(null);
  const [deltas, setDeltas] = useState({});
  const [newVariant, setNewVariant] = useState({ sku: '', size: '', color: '', stock_qty: '0' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

  // Puts a product from the server into the form.
  function showProduct(p) {
    setProduct(p);
    setForm({ name: p.name, description: p.description || '', price: String(p.price_cents / 100), category_id: String(p.category_id) });
  }

  useEffect(() => {
    setProduct(null);
    setMessage('');
    setError('');
    api
      .get('/admin/products/' + id)
      .then((data) => showProduct(data.product))
      .catch((err) => setLoadError(errorText(err)));
  }, [id]);

  // Runs one change on the server and shows the updated product, or the error.
  async function run(action, successText) {
    setMessage('');
    setError('');
    try {
      const data = await action();
      showProduct(data.product);
      setMessage(successText);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    }
  }

  function handleSave(event) {
    event.preventDefault();
    const changes = {
      name: form.name,
      description: form.description,
      price_cents: toPaise(form.price),
      category_id: Number(form.category_id),
    };
    run(() => api.patch('/admin/products/' + id, changes), 'Saved.');
  }

  function handleAdjust(variantId) {
    const delta = Number(deltas[variantId]);
    if (!delta) {
      setError('Type a number that is not 0 (use a minus sign to remove stock).');
      return;
    }
    setDeltas({ ...deltas, [variantId]: '' });
    run(() => api.post('/admin/variants/' + variantId + '/stock', { delta: delta }), 'Stock updated.');
  }

  function handleAddVariant(event) {
    event.preventDefault();
    const body = { ...newVariant, stock_qty: Number(newVariant.stock_qty) };
    setNewVariant({ sku: '', size: '', color: '', stock_qty: '0' });
    run(() => api.post('/admin/products/' + id + '/variants', body), 'Variant added.');
  }

  function handleDeactivate() {
    if (!window.confirm('Deactivate this product? Customers will no longer see it.')) return;
    run(() => api.delete('/admin/products/' + id), 'The product is deactivated.');
  }

  if (loadError) return <p role="alert" className="text-red-800">{loadError}</p>;
  if (!product) return <p role="status">Loading product...</p>;

  return (
    <section className="space-y-4 rounded-lg bg-white p-4 shadow" aria-label={'Edit ' + product.name}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit product #{product.id}</h2>
        <button onClick={onClose} className="text-sm underline">Close</button>
      </div>

      <div aria-live="polite">
        {message && <p className="rounded bg-green-50 p-2 text-green-900">{message}</p>}
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-red-900">{error}</p>}
      </div>

      <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="edit-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-category" className="mb-1 block text-sm font-medium">Category</label>
          <select id="edit-category" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="edit-description" className="mb-1 block text-sm font-medium">Description</label>
          <input id="edit-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-price" className="mb-1 block text-sm font-medium">Price (₹)</label>
          <input id="edit-price" type="number" min="0" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
        </div>
        <div className="flex items-end gap-3">
          <button type="submit" className={buttonClass}>Save changes</button>
          {product.is_active ? (
            <button type="button" onClick={handleDeactivate} className="rounded border border-red-700 px-4 py-2 text-red-800 hover:bg-red-50">Deactivate</button>
          ) : (
            <button type="button" onClick={() => run(() => api.patch('/admin/products/' + id, { is_active: true }), 'The product is active again.')}
              className="rounded border border-green-700 px-4 py-2 text-green-900 hover:bg-green-50">Reactivate</button>
          )}
        </div>
      </form>
      {!product.is_active && <p className="font-medium text-red-700">This product is inactive and hidden from customers.</p>}

      <div>
        <h3 className="mb-2 font-semibold">Variants and stock</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr><th className="p-2">SKU</th><th>Size</th><th>Colour</th><th>In stock</th><th>Change stock by</th></tr>
            </thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2">{v.sku}</td><td>{v.size}</td><td>{v.color}</td>
                  <td className={v.stock_qty === 0 ? 'font-bold text-red-700' : ''}>{v.stock_qty}</td>
                  <td>
                    <div className="flex gap-2">
                      <label htmlFor={'delta-' + v.id} className="sr-only">Change stock of {v.sku} by</label>
                      <input id={'delta-' + v.id} type="number" placeholder="+5 or -2" value={deltas[v.id] || ''}
                        onChange={(e) => setDeltas({ ...deltas, [v.id]: e.target.value })}
                        className="w-28 rounded border border-slate-400 px-2 py-1" />
                      <button onClick={() => handleAdjust(v.id)} className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-100">
                        Update<span className="sr-only"> {v.sku}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleAddVariant} className="grid gap-3 sm:grid-cols-5">
        <h3 className="font-semibold sm:col-span-5">Add a variant</h3>
        <div>
          <label htmlFor="variant-sku" className="mb-1 block text-sm font-medium">SKU</label>
          <input id="variant-sku" required minLength={3} value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="variant-size" className="mb-1 block text-sm font-medium">Size</label>
          <input id="variant-size" value={newVariant.size} onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="variant-color" className="mb-1 block text-sm font-medium">Colour</label>
          <input id="variant-color" value={newVariant.color} onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="variant-stock" className="mb-1 block text-sm font-medium">Stock</label>
          <input id="variant-stock" type="number" min="0" required value={newVariant.stock_qty} onChange={(e) => setNewVariant({ ...newVariant, stock_qty: e.target.value })} className={inputClass} />
        </div>
        <div className="flex items-end">
          <button type="submit" className={buttonClass}>Add variant</button>
        </div>
      </form>
    </section>
  );
}

// ---------- The page: a list of products, a create form and the editor ----------
export default function AdminProductsPage() {
  const [text, setText] = useState('');
  const [active, setActive] = useState('');
  const [search, setSearch] = useState({ q: '', active: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api
      .get('/admin/categories')
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(errorText(err)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '10' });
    if (search.q) params.set('q', search.q);
    if (search.active) params.set('active', search.active);
    setLoading(true);
    api
      .get('/admin/products?' + params.toString())
      .then(setResult)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [search, page, reloadKey]);

  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch({ q: text.trim(), active: active });
  }

  function handleCreated(newId) {
    setShowCreate(false);
    setSelectedId(newId);
    setReloadKey(reloadKey + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button onClick={() => setShowCreate(!showCreate)} className={buttonClass}>
          {showCreate ? 'Cancel' : 'New product'}
        </button>
      </div>

      {showCreate && <CreateProductForm categories={categories} onCreated={handleCreated} />}
      {selectedId && (
        <ProductEditor id={selectedId} categories={categories} onClose={() => setSelectedId(null)} onChanged={() => setReloadKey(reloadKey + 1)} />
      )}

      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="product-search" className="mb-1 block text-sm font-medium">Search</label>
          <input id="product-search" value={text} onChange={(e) => setText(e.target.value)} className="rounded border border-slate-400 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="product-active" className="mb-1 block text-sm font-medium">Show</label>
          <select id="product-active" value={active} onChange={(e) => setActive(e.target.value)} className="rounded border border-slate-400 px-3 py-2">
            <option value="">All products</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>
        <button type="submit" className={buttonClass}>Search</button>
      </form>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-900">{error}</p>}
      {loading && <p role="status">Loading products...</p>}
      {!loading && result && result.items.length === 0 && <p>No products found.</p>}

      {result && result.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr><th className="p-2">ID</th><th>Name</th><th>Category</th><th>Price</th><th>Variants</th><th>Stock</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {result.items.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.id}</td>
                  <td className="font-medium">{p.name}</td>
                  <td>{p.category_name}</td>
                  <td>{formatMoney(p.price_cents)}</td>
                  <td>{p.variant_count}</td>
                  <td>{p.total_stock}</td>
                  <td>{p.is_active ? 'Active' : <span className="font-medium text-red-700">Inactive</span>}</td>
                  <td>
                    <button onClick={() => setSelectedId(p.id)} className="rounded border border-slate-500 px-2 py-1 hover:bg-slate-100">
                      Edit<span className="sr-only"> {p.name}</span>
                    </button>
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
