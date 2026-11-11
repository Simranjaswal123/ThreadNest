// A coloured label for an order status. The text is always shown, so colour is never the only hint.
const colors = {
  placed: 'bg-amber-100 text-amber-900',
  paid: 'bg-blue-100 text-blue-900',
  packed: 'bg-indigo-100 text-indigo-900',
  shipped: 'bg-purple-100 text-purple-900',
  delivered: 'bg-green-100 text-green-900',
  cancelled: 'bg-red-100 text-red-900',
  // payment statuses
  pending: 'bg-amber-100 text-amber-900',
  succeeded: 'bg-green-100 text-green-900',
  failed: 'bg-red-100 text-red-900',
  refunded: 'bg-slate-200 text-slate-900',
};

export default function StatusBadge({ status }) {
  return (
    <span className={'inline-block rounded-full px-2 py-0.5 text-sm font-medium ' + (colors[status] || '')}>
      {status}
    </span>
  );
}
