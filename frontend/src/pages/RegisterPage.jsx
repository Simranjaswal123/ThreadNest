import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const inputClass = 'w-full rounded-md border border-slate-400 px-3 py-2 shadow-inner focus:border-link';

export default function RegisterPage() {
  const { user, loading, register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // The new customer is logged in, so "user" is set and the redirect below shows the shop.
      await register(fullName, email, password);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p role="status">Loading...</p>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-sm py-4">
      <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-3xl font-normal">Create account</h1>
        <p className="mb-4 text-sm text-slate-600">It only takes a minute.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-bold">Your name</label>
            <input id="fullName" type="text" required autoComplete="name" value={fullName}
              onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-bold">Password</label>
            <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-slate-600">At least 8 characters.</p>
          </div>

          <div aria-live="polite">
            {error && (
              <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                <b>There was a problem.</b> {error}
              </p>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-cta px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-cta-hover disabled:opacity-50">
            {submitting ? 'Creating your account...' : 'Create your account'}
          </button>
        </form>

        <p className="mt-5 border-t border-slate-200 pt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-link hover:text-link-hover hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
