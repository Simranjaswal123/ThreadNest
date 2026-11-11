import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wraps pages that need a logged in user. Anonymous visitors are sent to the login page,
// which sends them back here afterwards. (The server checks login too. This is only for comfort.)
export default function RequireLogin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p role="status">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
