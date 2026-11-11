// The simulated card input. No real card is ever used or saved.
export default function CardFields({ cardNumber, onChange }) {
  return (
    <div>
      <label htmlFor="cardNumber" className="mb-1 block text-sm font-medium">Card number (test card)</label>
      <input id="cardNumber" inputMode="numeric" autoComplete="off" value={cardNumber}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-400 px-3 py-2" />
      <p className="mt-2 text-sm text-slate-700">
        Test cards:{' '}
        <button type="button" onClick={() => onChange('4242 4242 4242 4242')} className="text-indigo-700 underline">
          4242 4242 4242 4242 (approved)
        </button>{' '}
        <button type="button" onClick={() => onChange('4000 0000 0000 0002')} className="text-indigo-700 underline">
          4000 0000 0000 0002 (declined)
        </button>
      </p>
    </div>
  );
}
