import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AddToCartButton({ variantId, quantity, disabled }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleClick() {
    // The cart belongs to a user, so anonymous visitors log in first.
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setAdding(true);
    setMessage('');
    setError('');
    try {
      await api.post('/cart/items', { variantId: variantId, quantity: quantity });
      setMessage('Added to cart.');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={disabled || adding}
        className="rounded bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {adding ? 'Adding...' : 'Add to cart'}
      </button>
      <div aria-live="polite" className="mt-2">
        {message && (
          <p className="text-green-800">
            {message} <Link to="/cart" className="underline">View cart</Link>
          </p>
        )}
        {error && <p className="text-red-800">{error}</p>}
      </div>
    </div>
  );
}
