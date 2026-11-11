import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Hides the admin pages from people who are not admins.
// This is only for comfort. Anybody can change what runs in their own browser, so the REAL
// protection is on the server: every /api/admin route checks the login and the admin role.
export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p role="status">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (user.role !== 'admin') {
    return <p role="alert" className="rounded bg-red-50 p-3 text-red-900">You do not have access to this page.</p>;
  }
  return children;
}
