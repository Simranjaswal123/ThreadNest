import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorText } from '../api.js';
import AddressForm from '../components/AddressForm.jsx';
import CardFields from '../components/CardFields.jsx';
import { formatMoney } from '../format.js';

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
      <p>
        Your cart is empty. <Link to="/" className="text-indigo-700 underline">Browse the shop</Link>
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="text-2xl font-bold">Checkout</h1>

        <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="address-heading">
          <h2 id="address-heading" className="mb-3 text-lg font-semibold">1. Shipping address</h2>
          {addresses.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="sr-only">Choose an address</legend>
              {addresses.map((a) => (
                <label key={a.id} className="flex cursor-pointer items-start gap-2 rounded border p-2">
                  <input type="radio" name="address" value={a.id} checked={addressId === String(a.id)}
                    onChange={(e) => setAddressId(e.target.value)} className="mt-1" />
                  <span>
                    {a.full_name}, {a.line1}{a.line2 ? ', ' + a.line2 : ''}, {a.city} {a.postal_code}, {a.country}
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-700 underline">
              Add a new address
            </button>
          )}
          {showForm && (
            <div className="mt-3">
              <AddressForm onSaved={handleAddressSaved} />
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-4 shadow" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="mb-3 text-lg font-semibold">2. Payment (simulated)</h2>
          <CardFields cardNumber={cardNumber} onChange={setCardNumber} />
        </section>
      </div>

      <aside className="h-fit rounded-lg bg-white p-4 shadow">
        <h2 className="mb-2 text-lg font-semibold">Order summary</h2>
        <ul className="mb-3 space-y-1 text-sm">
          {cart.items.map((item) => (
            <li key={item.variant_id} className="flex justify-between gap-2">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatMoney(item.line_total_cents)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t pt-2">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(cart.subtotal_cents)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{cart.shipping_cents === 0 ? 'Free' : formatMoney(cart.shipping_cents)}</dd></div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(cart.tax_cents)}</dd></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><dt>Total</dt><dd>{formatMoney(cart.total_cents)}</dd></div>
        </dl>

        <div aria-live="polite" className="mt-3">
          {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
        </div>

        <button onClick={handlePlaceOrder} disabled={placing || !addressId}
          className="mt-3 w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {placing ? 'Placing your order...' : 'Place order and pay'}
        </button>
        {!addressId && <p className="mt-2 text-sm text-slate-600">Add an address to continue.</p>}
      </aside>
    </div>
  );
}
