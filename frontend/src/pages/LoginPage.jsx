import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // RequireLogin and RequireAdmin send people here and remember the page they wanted.
  const goTo = location.state && location.state.from ? location.state.from : '/';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // When the login works, "user" is set and the redirect below sends the visitor onwards.
      await login(email, password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  // Wait until we know whether a login cookie exists, then skip the form if it does.
  if (loading) {
    return <p role="status">Loading...</p>;
  }
  if (user) {
    return <Navigate to={goTo} replace />;
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>

        {/* aria-live makes screen readers announce the error when it appears */}
        <div aria-live="polite">
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        New here? <Link to="/register" className="text-indigo-700 underline">Create an account</Link>
      </p>
    </div>
  );
}
