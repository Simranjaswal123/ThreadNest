import { useState } from 'react';

// A password box with a Show/Hide button, so people can check what they typed.
// The page puts a <label htmlFor={id}> above it.
export default function PasswordInput({ id, value, onChange, autoComplete, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} required minLength={minLength} autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-400 py-2 pl-3 pr-16 shadow-inner focus:border-link" />
      <button type="button" onClick={() => setVisible(!visible)} aria-pressed={visible} aria-controls={id}
        className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-link hover:text-link-hover">
        {visible ? 'Hide' : 'Show'}
        <span className="sr-only"> password</span>
      </button>
    </div>
  );
}
