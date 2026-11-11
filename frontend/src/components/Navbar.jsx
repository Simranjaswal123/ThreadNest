import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const linkClass = 'rounded px-1 hover:underline';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [shopName, setShopName] = useState('Threadnest');

  // The shop name comes from SHOP_NAME in .env, through the health endpoint.
  useEffect(() => {
    api
      .get('/health')
      .then((data) => setShopName(data.shop))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="bg-slate-900 text-white" aria-label="Main">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="text-xl font-bold">
          {shopName}
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link to="/" className={linkClass}>Shop</Link>
          <Link to="/cart" className={linkClass}>Cart</Link>
          {user && <Link to="/orders" className={linkClass}>My orders</Link>}
          {user && user.role === 'admin' && <Link to="/admin" className={linkClass}>Admin</Link>}

          {user ? (
            <>
              <span>Hi, {user.full_name}</span>
              <button onClick={handleLogout} className="rounded border border-white px-3 py-1 hover:bg-white hover:text-slate-900">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Log in</Link>
              <Link to="/register" className="rounded bg-indigo-500 px-3 py-1 hover:bg-indigo-400">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
