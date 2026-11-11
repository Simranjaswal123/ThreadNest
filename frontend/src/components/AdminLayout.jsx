import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/audit', label: 'Audit log' },
];

// The frame around every admin page: a menu and the page itself (Outlet).
export default function AdminLayout() {
  function linkClass({ isActive }) {
    const base = 'rounded px-3 py-1 hover:bg-slate-200 ';
    return base + (isActive ? 'bg-slate-900 text-white hover:bg-slate-800' : '');
  }

  return (
    <div>
      <nav aria-label="Admin" className="mb-6 flex flex-wrap gap-2 border-b pb-3">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
