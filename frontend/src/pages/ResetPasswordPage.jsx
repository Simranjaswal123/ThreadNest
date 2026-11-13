import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import PasswordInput from '../components/PasswordInput.jsx';

// Opened from the link in the reset email: /reset-password?token=...
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords are not the same.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token: token, password: password });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-4">
      <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-3xl font-normal">Set a new password</h1>

        {!token && (
          <p role="alert" className="text-sm text-red-800">
            This link is not complete. <Link to="/forgot-password" className="text-link underline">Ask for a new link</Link>.
          </p>
        )}

        {token && done && (
          <div aria-live="polite" className="space-y-3">
            <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
              Your password was changed.
            </p>
            <Link to="/login"
              className="block w-full rounded-full bg-cta px-4 py-2 text-center text-sm font-medium text-ink shadow-sm hover:bg-cta-hover">
              Sign in
            </Link>
          </div>
        )}

        {token && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-bold">New password</label>
              <PasswordInput id="new-password" minLength={8} autoComplete="new-password" value={password} onChange={setPassword} />
              <p className="mt-1 text-xs text-slate-600">At least 8 characters.</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-bold">Type it again</label>
              <PasswordInput id="confirm-password" minLength={8} autoComplete="new-password" value={confirm} onChange={setConfirm} />
            </div>

            <div aria-live="polite">
              {error && (
                <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">
                  {error}{' '}
                  {error.includes('expired') && <Link to="/forgot-password" className="text-link underline">Ask for a new link</Link>}
                </p>
              )}
            </div>

            <button type="submit" disabled={submitting}
              className="w-full rounded-full bg-cta px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-cta-hover disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
