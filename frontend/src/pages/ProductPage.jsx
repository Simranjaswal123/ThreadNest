import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import AddToCartButton from '../components/AddToCartButton.jsx';
import { formatMoney } from '../format.js';

const MAX_QUANTITY = 10;

// The colour shown in each colour button.
const swatches = {
  Black: '#1f1f1f',
  White: '#ffffff',
  Navy: '#1f2a44',
  Grey: '#9aa0a6',
  Olive: '#6b7f3a',
  Sand: '#d8c3a5',
  Red: '#c62828',
};

// All different values of a field (size or color) in the order they first appear.
function uniqueValues(variants, field) {
  const values = [];
  for (const variant of variants) {
    if (variant[field] && !values.includes(variant[field])) {
      values.push(variant[field]);
    }
  }
  return values;
}

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/products/' + id)
      .then((data) => {
        setProduct(data.product);
        // Start with the first size and colour.
        setSize(data.product.variants[0].size || '');
        setColor(data.product.variants[0].color || '');
      })
      .catch((err) => setError(err.status === 404 ? 'This product was not found.' : errorText(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p role="status">Loading product...</p>;
  if (error) {
    return (
      <div role="alert" className="rounded-sm bg-white p-6">
        <p className="text-red-800">{error}</p>
        <Link to="/" className="text-link underline hover:text-link-hover">Back to the shop</Link>
      </div>
    );
  }

  const sizes = uniqueValues(product.variants, 'size');
  const colors = uniqueValues(product.variants, 'color');
  // The variant the customer picked (a size and colour together).
  const variant = product.variants.find((v) => (v.size || '') === size && (v.color || '') === color);
  const stock = variant ? variant.stock_qty : 0;
  const maxQuantity = Math.min(stock, MAX_QUANTITY);

  // Stock of one size in the chosen colour (0 when that combination does not exist).
  function stockOf(sizeName) {
    const match = product.variants.find((v) => (v.size || '') === sizeName && (v.color || '') === color);
    return match ? match.stock_qty : 0;
  }

  function chooseSize(value) {
    setSize(value);
    setQuantity(1);
  }

  function chooseColor(value) {
    setColor(value);
    setQuantity(1);
  }

  return (
    <div className="space-y-3">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link to="/" className="hover:underline">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={'/?category=' + product.category_id} className="hover:underline">{product.category_name}</Link>{' '}
        <span aria-hidden="true">/</span> <span className="text-slate-900">{product.name}</span>
      </nav>

      <div className="grid gap-6 rounded-sm bg-white p-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_300px] lg:p-6">
        <div className="overflow-hidden rounded-sm bg-slate-100">
          <img src={product.image_url} alt={product.name} className="aspect-[4/5] w-full object-cover" />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-strong">{product.category_name}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
          </div>

          <div className="border-y border-slate-200 py-3">
            <p className="text-3xl font-bold text-slate-900">{formatMoney(product.price_cents)}</p>
            <p className="text-sm text-slate-600">Tax and delivery are added at checkout.</p>
          </div>

          {colors.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold uppercase tracking-wide">
                Colour: <span className="font-normal normal-case">{color}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button key={c} type="button" onClick={() => chooseColor(c)} aria-pressed={c === color}
                    className={'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ' +
                      (c === color ? 'border-brand-strong ring-1 ring-brand-strong' : 'border-slate-300 hover:border-slate-500')}>
                    <span aria-hidden="true" className="h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: swatches[c] || '#cccccc' }} />
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {sizes.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-sm font-bold uppercase tracking-wide">Select size</legend>
              <div className="flex flex-wrap gap-3">
                {sizes.map((s) => {
                  const left = stockOf(s);
                  return (
                    <button key={s} type="button" onClick={() => chooseSize(s)} disabled={left === 0} aria-pressed={s === size}
                      className={'h-12 w-12 rounded-full border text-sm font-bold disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:line-through ' +
                        (s === size ? 'border-brand-strong text-brand-strong ring-1 ring-brand-strong' : 'border-slate-300 hover:border-brand-strong')}>
                      {s}
                      {left === 0 && <span className="sr-only"> (sold out)</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {product.description && (
            <div>
              <h2 className="mb-1 text-sm font-bold uppercase tracking-wide">Product details</h2>
              <p className="text-slate-700">{product.description}</p>
            </div>
          )}
        </div>

        <aside aria-label="Buy this product" className="h-fit space-y-3 rounded-lg border border-slate-300 p-4">
          <p className="text-2xl font-bold">{formatMoney(product.price_cents)}</p>
          <p aria-live="polite" className="text-lg font-medium">
            {!variant && <span className="text-red-700">Not available in this combination</span>}
            {variant && stock === 0 && <span className="text-red-700">Currently sold out</span>}
            {variant && stock > 0 && stock <= 5 && <span className="text-amber-700">Only {stock} left in stock</span>}
            {variant && stock > 5 && <span className="text-green-700">In stock</span>}
          </p>
          {stock > 0 && (
            <div>
              <label htmlFor="quantity" className="mr-2 text-sm">Quantity:</label>
              <select id="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-sm shadow-sm">
                {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
          <AddToCartButton variantId={variant ? variant.id : 0} quantity={quantity} disabled={!variant || stock === 0} />
          <p className="text-xs text-slate-600">
            You can cancel an order until it is shipped. Payments in this demo shop are simulated.
          </p>
        </aside>
      </div>
    </div>
  );
}
