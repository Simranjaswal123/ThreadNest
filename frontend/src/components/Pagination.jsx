// Previous / next buttons for a list. Hidden when there is only one page.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const buttonClass = 'rounded border border-slate-500 px-3 py-1 hover:bg-slate-100 disabled:opacity-40';

  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-4">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={buttonClass}>
        Previous
      </button>
      <span aria-live="polite">Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={buttonClass}>
        Next
      </button>
    </nav>
  );
}
