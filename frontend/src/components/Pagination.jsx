// Previous, page numbers and next. Hidden when there is only one page.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const numbers = [];
  for (let n = 1; n <= totalPages; n++) {
    numbers.push(n);
  }

  const buttonClass = 'min-w-9 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-40';

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className={buttonClass}>
        ‹ Previous
      </button>
      {numbers.map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
          className={n === page ? buttonClass + ' border-slate-900 font-bold' : buttonClass}>
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className={buttonClass}>
        Next ›
      </button>
    </nav>
  );
}
