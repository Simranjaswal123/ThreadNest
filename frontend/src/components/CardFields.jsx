// The simulated card input. No real card is ever used or saved.
export default function CardFields({ cardNumber, onChange }) {
  const chipClass = 'rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:border-slate-500';

  return (
    <div>
      <label htmlFor="cardNumber" className="mb-1 block text-sm font-medium">Card number (test card)</label>
      <input id="cardNumber" inputMode="numeric" autoComplete="off" value={cardNumber}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-sm rounded-md border border-slate-400 px-3 py-2 tracking-widest" />
      <p className="mt-3 text-sm text-slate-700">Try one of the test cards:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange('4242 4242 4242 4242')} className={chipClass}>
          4242 4242 4242 4242 · <span className="font-bold text-green-700">approved</span>
        </button>
        <button type="button" onClick={() => onChange('4000 0000 0000 0002')} className={chipClass}>
          4000 0000 0000 0002 · <span className="font-bold text-red-700">declined</span>
        </button>
      </div>
    </div>
  );
}
