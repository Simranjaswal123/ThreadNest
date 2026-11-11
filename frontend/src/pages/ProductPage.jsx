import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import AddToCartButton from '../components/AddToCartButton.jsx';
import { formatMoney } from '../format.js';

const MAX_QUANTITY = 10;
const selectClass = 'rounded border border-slate-400 px-3 py-2';

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
      <div role="alert">
        <p className="text-red-800">{error}</p>
        <Link to="/" className="text-indigo-700 underline">Back to the shop</Link>
      </div>
    );
  }

  const sizes = uniqueValues(product.variants, 'size');
  const colors = uniqueValues(product.variants, 'color');
  // The variant the customer picked (a size and colour together).
  const variant = product.variants.find((v) => (v.size || '') === size && (v.color || '') === color);
  const stock = variant ? variant.stock_qty : 0;
  const maxQuantity = Math.min(stock, MAX_QUANTITY);

  function changeSelection(setter, value) {
    setter(value);
    setQuantity(1);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <img src={product.image_url} alt={product.name} className="w-full rounded-lg bg-slate-200" />

      <div>
        <Link to="/" className="text-sm text-indigo-700 underline">Back to the shop</Link>
        <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
        <p className="text-slate-600">{product.category_name}</p>
        <p className="mt-2 text-xl font-semibold">{formatMoney(product.price_cents)}</p>
        <p className="mt-3">{product.description}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          {sizes.length > 0 && (
            <div>
              <label htmlFor="size" className="mb-1 block text-sm font-medium">Size</label>
              <select id="size" value={size} onChange={(e) => changeSelection(setSize, e.target.value)} className={selectClass}>
                {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          {colors.length > 0 && (
            <div>
              <label htmlFor="color" className="mb-1 block text-sm font-medium">Colour</label>
              <select id="color" value={color} onChange={(e) => changeSelection(setColor, e.target.value)} className={selectClass}>
                {colors.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          {stock > 0 && (
            <div>
              <label htmlFor="quantity" className="mb-1 block text-sm font-medium">Quantity</label>
              <select id="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={selectClass}>
                {Array.from({ length: maxQuantity }, (_, index) => index + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <p className="mt-3 text-sm" aria-live="polite">
          {!variant && 'This combination is not available.'}
          {variant && stock === 0 && <span className="font-medium text-red-700">Sold out</span>}
          {variant && stock > 0 && stock <= 5 && <span className="font-medium text-amber-800">Only {stock} left</span>}
          {variant && stock > 5 && <span>In stock</span>}
        </p>

        <div className="mt-4">
          <AddToCartButton variantId={variant ? variant.id : 0} quantity={quantity} disabled={!variant || stock === 0} />
        </div>
      </div>
    </div>
  );
}
