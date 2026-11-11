import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../format.js';

const MAX_QUANTITY = 10;

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .get('/cart')
      .then(setCart)
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [user]);

  // The server sends back the whole cart with new totals after every change.
  async function changeQuantity(variantId, quantity) {
    setError('');
    try {
      setCart(await api.patch('/cart/items/' + variantId, { quantity: quantity }));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function removeItem(variantId) {
    setError('');
    try {
      setCart(await api.delete('/cart/items/' + variantId));
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (authLoading || loading) return <p role="status">Loading your cart...</p>;

  if (!user) {
    return (
      <p>
        Please <Link to="/login" state={{ from: '/cart' }} className="text-indigo-700 underline">log in</Link> to see your cart.
      </p>
    );
  }

  if (!cart) {
    return <p role="alert" className="text-red-800">{error || 'Could not load the cart.'}</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div>
        <h1 className="mb-3 text-2xl font-bold">Your cart</h1>
        <p>Your cart is empty. <Link to="/" className="text-indigo-700 underline">Browse the shop</Link></p>
      </div>
    );
  }

  const somethingUnavailable = cart.items.some((item) => !item.available);
  const missingForFreeShipping = cart.free_shipping_threshold_cents - cart.subtotal_cents;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Your cart</h1>

      <div aria-live="polite">
        {error && <p role="alert" className="mb-3 rounded bg-red-50 p-2 text-red-800">{error}</p>}
      </div>

      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li key={item.variant_id} className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-3 shadow">
            <img src={item.image_url} alt={item.product_name} className="h-20 w-20 rounded bg-slate-200 object-cover" />
            <div className="min-w-40 flex-1">
              <Link to={'/products/' + item.product_id} className="font-semibold hover:underline">{item.product_name}</Link>
              <p className="text-sm text-slate-600">
                {[item.size, item.color].filter(Boolean).join(' / ')} · {formatMoney(item.price_cents)} each
              </p>
              {!item.available && (
                <p className="text-sm font-medium text-red-700">Not enough stock for this quantity. Lower it or remove it.</p>
              )}
            </div>
            <div>
              <label htmlFor={'qty-' + item.variant_id} className="sr-only">Quantity of {item.product_name}</label>
              <select id={'qty-' + item.variant_id} value={item.quantity}
                onChange={(e) => changeQuantity(item.variant_id, Number(e.target.value))}
                className="rounded border border-slate-400 px-2 py-1">
                {Array.from({ length: MAX_QUANTITY }, (_, index) => index + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <p className="w-28 text-right font-medium">{formatMoney(item.line_total_cents)}</p>
            <button onClick={() => removeItem(item.variant_id)} className="text-sm text-red-700 underline">
              Remove<span className="sr-only"> {item.product_name}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 ml-auto max-w-sm rounded-lg bg-white p-4 shadow">
        <dl className="space-y-1">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal_cents)}</dd></div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{cart.shipping_cents === 0 ? 'Free' : formatMoney(cart.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(cart.tax_cents)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <dt>Total</dt><dd>{formatMoney(cart.total_cents)}</dd>
          </div>
        </dl>
        {cart.shipping_cents > 0 && (
          <p className="mt-2 text-sm text-slate-600">
            Add {formatMoney(missingForFreeShipping)} more for free shipping.
          </p>
        )}
        {somethingUnavailable ? (
          <p className="mt-3 text-sm font-medium text-red-700">Fix the items marked above before checkout.</p>
        ) : (
          <Link to="/checkout" className="mt-3 block rounded bg-indigo-600 px-4 py-2 text-center font-medium text-white hover:bg-indigo-700">
            Go to checkout
          </Link>
        )}
      </div>
    </div>
  );
}
