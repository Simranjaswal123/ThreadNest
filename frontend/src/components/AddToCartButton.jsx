import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

// The two buttons of the buy box: "Add to Cart" stays on the page, "Buy Now" adds and goes to checkout.
export default function AddToCartButton({ variantId, quantity, disabled }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function addToCart(goToCheckout) {
    // The cart belongs to a user, so anonymous visitors log in first.
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setBusy(goToCheckout ? 'buy' : 'add');
    setMessage('');
    setError('');
    try {
      await api.post('/cart/items', { variantId: variantId, quantity: quantity });
      // Tells the navbar to update the number on the cart icon.
      window.dispatchEvent(new Event('cart-changed'));
      if (goToCheckout) {
        navigate('/checkout');
        return;
      }
      setMessage('Added to cart.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-2">
      <button onClick={() => addToCart(false)} disabled={disabled || busy !== ''}
        className="w-full rounded-full bg-cta px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-50">
        {busy === 'add' ? 'Adding...' : 'Add to Cart'}
      </button>
      <button onClick={() => addToCart(true)} disabled={disabled || busy !== ''}
        className="w-full rounded-full bg-buy px-5 py-2.5 text-sm font-medium text-ink shadow-sm hover:bg-buy-hover disabled:cursor-not-allowed disabled:opacity-50">
        {busy === 'buy' ? 'One moment...' : 'Buy Now'}
      </button>
      <div aria-live="polite">
        {message && (
          <p className="text-sm font-medium text-green-800">
            ✓ {message} <Link to="/cart" className="text-link underline hover:text-link-hover">Go to cart</Link>
          </p>
        )}
        {error && <p className="text-sm text-red-800">{error}</p>}
      </div>
    </div>
  );
}
