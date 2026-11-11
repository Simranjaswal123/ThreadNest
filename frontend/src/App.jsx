import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import RequireLogin from './components/RequireLogin.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderDetailPage from './pages/OrderDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// All routes of the app live here.
export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
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
        </Routes>
      </main>
    </div>
  );
}
