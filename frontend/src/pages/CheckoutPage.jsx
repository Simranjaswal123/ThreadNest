import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorText } from '../api.js';
import AddressForm from '../components/AddressForm.jsx';
import CardFields from '../components/CardFields.jsx';
import { formatMoney } from '../format.js';

const sectionClass = 'rounded-sm bg-white p-4 shadow-sm lg:p-6';
const headingClass = 'mb-3 text-sm font-bold uppercase tracking-wide text-slate-900';

export default function CheckoutPage() {
  const navigate = useNavigate();

  // Rule 2: the key is made ONCE, when this page opens. Every click on "Place order" sends the
  // same key, so a double click or a retry can only ever create one order.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/cart'), api.get('/addresses')])
      .then(([cartData, addressData]) => {
        setCart(cartData);
        setAddresses(addressData.addresses);
        if (addressData.addresses.length > 0) {
          setAddressId(String(addressData.addresses[0].id));
        } else {
          setShowForm(true);
        }
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  function handleAddressSaved(address) {
    setAddresses([...addresses, address]);
    setAddressId(String(address.id));
    setShowForm(false);
  }

  async function handlePlaceOrder() {
    if (placing) return;
    setPlacing(true);
    setError('');
    try {
      const headers = { 'Idempotency-Key': idempotencyKey };
      const result = await api.post('/checkout', { addressId: Number(addressId) }, headers);
      const orderId = result.order.id;

      // Then pay. A declined card is not an error here: the order stays "placed".
      let payment = null;
      try {
        const paid = await api.post('/orders/' + orderId + '/pay', { cardNumber: cardNumber });
        payment = paid.payment;
      } catch (payError) {
        // 409 means the order was already paid (for example by an earlier click).
        payment = payError.status === 409 ? null : { status: 'failed', message: errorText(payError) };
      }
      navigate('/orders/' + orderId + '/confirmation', { state: { payment: payment } });
    } catch (err) {
      setError(errorText(err));
      setPlacing(false);
    }
  }

  if (loading) return <p role="status">Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-sm bg-white p-10 text-center">
        <p className="text-lg font-bold">Your cart is empty</p>
        <Link to="/" className="mt-3 inline-block text-link underline hover:text-link-hover">Continue shopping</Link>
      </div>
    );
  }

  let itemCount = 0;
  for (const item of cart.items) {
    itemCount = itemCount + item.quantity;
  }

  return (
    <div>
      {/* The steps of the checkout, like a progress line */}
      <ol className="mb-6 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500" aria-label="Checkout steps">
        <li>Bag</li>
        <li aria-hidden="true" className="h-px w-10 border-t border-dashed border-slate-400" />
        <li className="text-brand-strong" aria-current="step">Address &amp; payment</li>
        <li aria-hidden="true" className="h-px w-10 border-t border-dashed border-slate-400" />
        <li>Done</li>
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">Checkout</h1>

          <section className={sectionClass} aria-labelledby="address-heading">
            <h2 id="address-heading" className={headingClass}>1. Delivery address</h2>
            {addresses.length > 0 && (
              <fieldset className="space-y-2">
                <legend className="sr-only">Choose an address</legend>
                {addresses.map((a) => (
                  <label key={a.id}
                    className={'flex cursor-pointer items-start gap-3 rounded-md border p-3 ' +
                      (addressId === String(a.id) ? 'border-brand-strong bg-pink-50' : 'border-slate-300 hover:border-slate-500')}>
                    <input type="radio" name="address" value={a.id} checked={addressId === String(a.id)}
                      onChange={(e) => setAddressId(e.target.value)} className="mt-1 h-4 w-4 accent-brand-strong" />
                    <span className="text-sm">
                      <b>{a.full_name}</b>
                      <br />
                      {a.line1}{a.line2 ? ', ' + a.line2 : ''}, {a.city} {a.postal_code}, {a.country}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-bold uppercase tracking-wide text-brand-strong hover:underline">
                + Add a new address
              </button>
            )}
            {showForm && (
              <div className="mt-3 border-t border-slate-200 pt-3">
                <AddressForm onSaved={handleAddressSaved} />
              </div>
            )}
          </section>

          <section className={sectionClass} aria-labelledby="payment-heading">
            <h2 id="payment-heading" className={headingClass}>2. Payment (simulated)</h2>
            <CardFields cardNumber={cardNumber} onChange={setCardNumber} />
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-sm bg-white p-4 shadow-sm" aria-label="Price details">
          <h2 className={headingClass}>Price details ({itemCount} items)</h2>
          <ul className="space-y-2 text-sm">
            {cart.items.map((item) => (
              <li key={item.variant_id} className="flex justify-between gap-2">
                <span className="text-slate-700">{item.product_name} × {item.quantity}</span>
                <span>{formatMoney(item.line_total_cents)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-slate-200 pt-3 text-sm">
            <div className="flex justify-between"><dt>Total items</dt><dd>{formatMoney(cart.subtotal_cents)}</dd></div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{cart.shipping_cents === 0 ? <span className="font-medium text-green-700">FREE</span> : formatMoney(cart.shipping_cents)}</dd>
            </div>
            <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(cart.tax_cents)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <dt>Total amount</dt><dd>{formatMoney(cart.total_cents)}</dd>
            </div>
          </dl>

          <div aria-live="polite">
            {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
          </div>

          <button onClick={handlePlaceOrder} disabled={placing || !addressId}
            className="w-full rounded-md bg-brand-strong px-4 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50">
            {placing ? 'Placing your order...' : 'Place order and pay'}
          </button>
          {!addressId && <p className="text-sm text-slate-600">Add an address to continue.</p>}
        </aside>
      </div>
    </div>
  );
}
