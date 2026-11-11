import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { errorText } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
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
      await register(fullName, email, password);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
      <h1 className="mb-4 text-2xl font-bold">Create an account</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">Full name</label>
          <input id="fullName" type="text" required autoComplete="name" value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password (at least 8 characters)</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-slate-400 px-3 py-2" />
        </div>

        <div aria-live="polite">
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account? <Link to="/login" className="text-indigo-700 underline">Log in</Link>
      </p>
    </div>
  );
}
