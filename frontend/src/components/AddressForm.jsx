import { useState } from 'react';
import { api, errorText } from '../api.js';

const emptyForm = {
  full_name: '',
  line1: '',
  line2: '',
  city: '',
  postal_code: '',
  country: 'India',
  phone: '',
};

const inputClass = 'w-full rounded border border-slate-400 px-3 py-2';

// A form that saves a new address. When it works, it calls onSaved with the new address.
export default function AddressForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = await api.post('/addresses', form);
      setForm(emptyForm);
      onSaved(data.address);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  // One field = a label and an input. Written out for each field to keep it easy to read.
  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium">Full name</label>
        <input id="full_name" name="full_name" required value={form.full_name} onChange={handleChange} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="line1" className="mb-1 block text-sm font-medium">Address line 1</label>
        <input id="line1" name="line1" required value={form.line1} onChange={handleChange} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="line2" className="mb-1 block text-sm font-medium">Address line 2 (optional)</label>
        <input id="line2" name="line2" value={form.line2} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="city" className="mb-1 block text-sm font-medium">City</label>
        <input id="city" name="city" required value={form.city} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="postal_code" className="mb-1 block text-sm font-medium">Postal code</label>
        <input id="postal_code" name="postal_code" required value={form.postal_code} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="country" className="mb-1 block text-sm font-medium">Country</label>
        <input id="country" name="country" required value={form.country} onChange={handleChange} className={inputClass} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium">Phone (optional)</label>
        <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} />
      </div>

      <div className="sm:col-span-2" aria-live="polite">
        {error && <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      </div>

      <div className="sm:col-span-2">
        <button type="submit" disabled={saving}
          className="rounded bg-brand-strong px-4 py-2 font-medium text-white hover:bg-brand-deep disabled:opacity-50">
          {saving ? 'Saving...' : 'Save address'}
        </button>
      </div>
    </form>
  );
}
