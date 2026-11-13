import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorText } from '../api.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email: email });
      setSent(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm py-4">
      <div className="rounded-lg border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-3xl font-normal">Password assistance</h1>

        {sent ? (
          <div aria-live="polite" className="space-y-3">
            <p className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-900">
              If an account exists for <b>{email}</b>, we have sent a link to reset your password.
              The link works for 30 minutes.
            </p>
            <p className="text-xs text-slate-600">
              This demo shop has no email service: the email is written to the server log.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-600">Enter the email address of your Threadnest account.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-bold">Email</label>
                <input id="email" type="email" required autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-400 px-3 py-2 shadow-inner focus:border-link" />
              </div>

              <div aria-live="polite">
                {error && <p className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-800">{error}</p>}
              </div>

              <button type="submit" disabled={submitting}
                className="w-full rounded-full bg-cta px-4 py-2 text-sm font-medium text-ink shadow-sm hover:bg-cta-hover disabled:opacity-50">
                {submitting ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          </>
        )}

        <p className="mt-5 border-t border-slate-200 pt-4 text-sm">
          Remembered it? <Link to="/login" className="text-link hover:text-link-hover hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
