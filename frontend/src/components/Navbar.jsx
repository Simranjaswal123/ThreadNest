import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../format.js';

// Small inline icons, so no icon library is needed.
function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 8H6" />
      <circle cx="9.5" cy="19.5" r="1.5" />
      <circle cx="17.5" cy="19.5" r="1.5" />
    </svg>
  );
}

// A thin white frame on hover, like the header links of big online stores.
const headerLink = 'rounded-sm border border-transparent px-2 py-1 leading-tight hover:border-white';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shopName, setShopName] = useState('Threadnest');
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [freeFrom, setFreeFrom] = useState(null);

  // The shop name comes from SHOP_NAME in .env, through the health endpoint.
  useEffect(() => {
    api.get('/health').then((data) => setShopName(data.shop)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/categories').then((data) => setCategories(data.categories)).catch(() => {});
  }, [user]);

  // The number on the cart icon. It is loaded again after every page change and whenever
  // a page sends the "cart-changed" event (add to cart, change or remove a line).
  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    function loadCart() {
      api
        .get('/cart')
        .then((cart) => {
          let count = 0;
          for (const item of cart.items) {
            count = count + item.quantity;
          }
          setCartCount(count);
          setFreeFrom(cart.free_shipping_threshold_cents);
        })
        .catch(() => {});
    }
    loadCart();
    window.addEventListener('cart-changed', loadCart);
    return () => window.removeEventListener('cart-changed', loadCart);
  }, [user, location.pathname]);

  // Keep the search box in step with the address bar (?q=...).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('q') || '');
  }, [location.search]);

  function handleSearch(event) {
    event.preventDefault();
    const text = search.trim();
    navigate(text ? '/?q=' + encodeURIComponent(text) : '/');
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const firstName = user ? user.full_name.split(' ')[0] : '';

  return (
    <header>
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 md:flex-nowrap">
          <Link to="/" className={headerLink + ' text-2xl font-extrabold tracking-tight'}>
            {shopName}<span className="text-brand">.</span>
          </Link>

          {user && (
            <form onSubmit={handleSearch} role="search" className="order-last flex w-full md:order-none md:mx-4 md:flex-1">
              <label htmlFor="site-search" className="sr-only">Search products</label>
              <input id="site-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for T-shirts, hoodies, caps and more"
                className="w-full rounded-l-md border-0 bg-white px-4 py-2 text-slate-900 placeholder:text-slate-500" />
              <button type="submit" className="rounded-r-md bg-buy px-4 text-ink hover:bg-buy-hover">
                <SearchIcon />
                <span className="sr-only">Search</span>
              </button>
            </form>
          )}

          <nav aria-label="Account" className="ml-auto flex items-center gap-1 text-sm">
            {user ? (
              <>
                <div className="hidden px-2 leading-tight sm:block">
                  <span className="block text-xs text-slate-300">Hello, {firstName}</span>
                  <span className="font-bold">{user.role === 'admin' ? 'Admin account' : 'Your account'}</span>
                </div>
                <Link to="/orders" className={headerLink}>
                  <span className="block text-xs text-slate-300">Returns</span>
                  <span className="font-bold">&amp; Orders</span>
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className={headerLink}>
                    <span className="block text-xs text-slate-300">Manage</span>
                    <span className="font-bold">Admin</span>
                  </Link>
                )}
                <Link to="/cart" className={headerLink + ' relative flex items-end gap-1'}>
                  <CartIcon />
                  <span className="absolute left-5 top-0 min-w-5 rounded-full bg-brand-strong px-1 text-center text-xs font-bold">
                    {cartCount}
                  </span>
                  <span className="font-bold">Cart</span>
                  <span className="sr-only">, {cartCount} items</span>
                </Link>
                <button onClick={handleLogout} className={headerLink + ' text-xs text-slate-200'}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={headerLink + ' font-bold'}>Sign in</Link>
                <Link to="/register" className="rounded-md bg-brand-strong px-3 py-1.5 font-bold hover:bg-brand-deep">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {user && (
        <nav aria-label="Categories" className="bg-ink-light text-sm text-white">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-1">
            <Link to="/" className={headerLink + ' whitespace-nowrap font-bold'}>All</Link>
            {categories.map((category) => (
              <Link key={category.id} to={'/?category=' + category.id} className={headerLink + ' whitespace-nowrap'}>
                {category.name}
              </Link>
            ))}
            {freeFrom && (
              <span className="ml-auto hidden whitespace-nowrap px-2 font-semibold text-cta md:block">
                Free delivery on orders over {formatMoney(freeFrom)}
              </span>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
