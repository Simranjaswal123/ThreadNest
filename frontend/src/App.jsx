import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import RequireLogin from './components/RequireLogin.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/admin/DashboardPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminCustomersPage from './pages/admin/AdminCustomersPage.jsx';
import AdminAuditPage from './pages/admin/AdminAuditPage.jsx';

// The browser tab title for each part of the site. The first match wins, so longer paths come first.
const titles = [
  ['/admin/products', 'Admin: products'],
  ['/admin/orders', 'Admin: orders'],
  ['/admin/customers', 'Admin: customers'],
  ['/admin/audit', 'Admin: audit log'],
  ['/admin', 'Admin: dashboard'],
  ['/checkout', 'Checkout'],
  ['/cart', 'Cart'],
  ['/orders', 'My orders'],
  ['/products/', 'Product'],
  ['/login', 'Log in'],
  ['/register', 'Register'],
];

function titleFor(pathname) {
  for (const [start, title] of titles) {
    if (pathname.startsWith(start)) {
      return title + ' - Threadnest';
    }
  }
  return 'Shop - Threadnest';
}

// All routes of the app live here.
export default function App() {
  const location = useLocation();
  const mainRef = useRef(null);

  // On every page change: update the tab title and move the keyboard focus to the page content,
  // so keyboard and screen reader users start at the top of the new page.
  useEffect(() => {
    document.title = titleFor(location.pathname);
    mainRef.current.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* The first thing a keyboard user can reach: a link past the menu. */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to main content
      </a>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<RequireLogin><CheckoutPage /></RequireLogin>} />
          <Route path="/orders" element={<RequireLogin><OrdersPage /></RequireLogin>} />
          <Route path="/orders/:id" element={<RequireLogin><OrderDetailPage /></RequireLogin>} />
          <Route path="/orders/:id/confirmation" element={<RequireLogin><OrderConfirmationPage /></RequireLogin>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* The admin area. The guard is cosmetic: the API checks the role for real. */}
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}
