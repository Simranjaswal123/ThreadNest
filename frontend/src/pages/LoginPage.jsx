import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const inputClass = 'w-full rounded-md border border-slate-400 px-3 py-2 shadow-inner focus:border-link';

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
    <div className="mx-auto max-w-sm py-4">
      <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-3xl font-normal">Sign in</h1>
        <p className="mb-4 text-sm text-slate-600">Welcome back. Your bag and orders are waiting.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-bold">Password</label>
              <Link to="/forgot-password" className="text-sm text-link hover:text-link-hover hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" autoComplete="current-password" value={password} onChange={setPassword} />
          </div>

          {/* aria-live makes screen readers announce the error when it appears */}
          <div aria-live="polite">
            {error && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                <b>There was a problem.</b> {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-cta px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-cta-hover disabled:opacity-50">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-slate-600">
        <span className="h-px flex-1 bg-slate-300" />
        New to Threadnest?
        <span className="h-px flex-1 bg-slate-300" />
      </div>

      <Link to="/register"
        className="block w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-center text-sm shadow-sm hover:bg-slate-50">
        Create your Threadnest account
      </Link>
    </div>
  );
}
