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
      window.dispatchEvent(new Event('cart-changed'));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function removeItem(variantId) {
    setError('');
    try {
      setCart(await api.delete('/cart/items/' + variantId));
      window.dispatchEvent(new Event('cart-changed'));
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (authLoading || loading) return <p role="status">Loading your cart...</p>;

  if (!user) {
    return (
      <p>
        Please <Link to="/login" state={{ from: '/cart' }} className="text-link underline">log in</Link> to see your cart.
      </p>
    );
  }

  if (!cart) {
    return <p role="alert" className="text-red-800">{error || 'Could not load the cart.'}</p>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-sm bg-white p-10 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">There is nothing in your bag. Let's add some items.</p>
        <Link to="/" className="mt-5 inline-block rounded-md border border-brand-strong px-6 py-2 font-bold uppercase tracking-wide text-brand-strong hover:bg-pink-50">
          Continue shopping
        </Link>
      </div>
    );
  }

  let itemCount = 0;
  for (const item of cart.items) {
    itemCount = itemCount + item.quantity;
  }
  const somethingUnavailable = cart.items.some((item) => !item.available);
  const missingForFreeShipping = cart.free_shipping_threshold_cents - cart.subtotal_cents;
  // How far the progress bar towards free delivery is filled, from 0 to 100.
  const progress = Math.min(100, Math.round((cart.subtotal_cents / cart.free_shipping_threshold_cents) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="rounded-sm bg-white p-4 lg:p-6">
        <h1 className="text-2xl font-semibold">Shopping Cart</h1>
        <p className="border-b border-slate-200 pb-2 text-right text-sm text-slate-600">Price</p>

        <div aria-live="polite">
          {error && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-red-800">{error}</p>}
        </div>

        <ul className="divide-y divide-slate-200">
          {cart.items.map((item) => (
            <li key={item.variant_id} className="flex gap-4 py-4">
              <Link to={'/products/' + item.product_id} className="shrink-0">
                <img src={item.image_url} alt={item.product_name} className="aspect-[4/5] w-24 rounded-sm bg-slate-100 object-cover sm:w-28" />
              </Link>
              <div className="min-w-0 flex-1 space-y-1">
                <Link to={'/products/' + item.product_id} className="text-lg font-medium hover:text-link-hover hover:underline">
                  {item.product_name}
                </Link>
                {item.available ? (
                  <p className="text-xs font-medium text-green-700">In stock</p>
                ) : (
                  <p className="text-xs font-medium text-red-700">Not enough stock for this quantity. Lower it or remove it.</p>
                )}
                <p className="text-sm text-slate-700">
                  {item.size && <span>Size: <b>{item.size}</b> </span>}
                  {item.color && <span>Colour: <b>{item.color}</b></span>}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                  <label htmlFor={'qty-' + item.variant_id} className="sr-only">Quantity of {item.product_name}</label>
                  <select id={'qty-' + item.variant_id} value={item.quantity}
                    onChange={(e) => changeQuantity(item.variant_id, Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 shadow-sm">
                    {Array.from({ length: MAX_QUANTITY }, (_, index) => index + 1).map((n) => (
                      <option key={n} value={n}>Qty: {n}</option>
                    ))}
                  </select>
                  <span aria-hidden="true" className="text-slate-300">|</span>
                  <button onClick={() => removeItem(item.variant_id)} className="text-link hover:text-link-hover hover:underline">
                    Delete<span className="sr-only"> {item.product_name}</span>
                  </button>
                </div>
              </div>
              <p className="font-bold">{formatMoney(item.line_total_cents)}</p>
            </li>
          ))}
        </ul>

        <p className="border-t border-slate-200 pt-3 text-right text-lg">
          Subtotal ({itemCount} items): <b>{formatMoney(cart.subtotal_cents)}</b>
        </p>
      </section>

      <aside aria-label="Order summary" className="h-fit space-y-4 rounded-sm bg-white p-4">
        {cart.shipping_cents === 0 ? (
          <p className="text-sm font-medium text-green-800">✓ Your order qualifies for FREE delivery.</p>
        ) : (
          <div>
            <p className="text-sm">
              Add <b>{formatMoney(missingForFreeShipping)}</b> more for <b className="text-green-800">FREE delivery</b>.
            </p>
            <div className="mt-2 h-2 rounded-full bg-slate-200" aria-hidden="true">
              <div className="h-2 rounded-full bg-green-600" style={{ width: progress + '%' }} />
            </div>
          </div>
        )}

        <dl className="space-y-1 border-t border-slate-200 pt-3 text-sm">
          <div className="flex justify-between"><dt>Items</dt><dd>{formatMoney(cart.subtotal_cents)}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{cart.shipping_cents === 0 ? <span className="text-green-800">FREE</span> : formatMoney(cart.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(cart.tax_cents)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
            <dt>Order total</dt><dd>{formatMoney(cart.total_cents)}</dd>
          </div>
        </dl>

        {somethingUnavailable ? (
          <p className="text-sm font-medium text-red-700">Fix the items marked in red before checkout.</p>
        ) : (
          <Link to="/checkout" className="block w-full rounded-full bg-cta px-4 py-2.5 text-center text-sm font-medium text-ink shadow-sm hover:bg-cta-hover">
            Proceed to Buy ({itemCount} items)
          </Link>
        )}
      </aside>
    </div>
  );
}
