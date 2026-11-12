import { useState } from 'react';

const headingClass = 'mb-2 text-xs font-bold uppercase tracking-wide text-slate-900';

// The filter panel on the left of the shop. Category and stock apply at once; the price
// range applies when "Go" is pressed. All filters live in the URL.
// The page re-creates this panel whenever the URL changes (key={query}), so the price boxes
// always start with the values from the URL.
export default function Filters({ params, categories, onChange }) {
  // The URL holds paise but people type rupees.
  const [minRupees, setMinRupees] = useState(params.get('minPrice') ? Number(params.get('minPrice')) / 100 : '');
  const [maxRupees, setMaxRupees] = useState(params.get('maxPrice') ? Number(params.get('maxPrice')) / 100 : '');
  const selectedCategory = params.get('category') || '';

  // Copies the current filters, changes one of them and goes back to page 1.
  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value === '') {
      next.delete(name);
    } else {
      next.set(name, value);
    }
    next.delete('page');
    onChange(next);
  }

  function handlePrice(event) {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (minRupees === '') {
      next.delete('minPrice');
    } else {
      next.set('minPrice', String(Math.round(Number(minRupees) * 100)));
    }
    if (maxRupees === '') {
      next.delete('maxPrice');
    } else {
      next.set('maxPrice', String(Math.round(Number(maxRupees) * 100)));
    }
    next.delete('page');
    onChange(next);
  }

  return (
    <aside aria-label="Filters" className="h-fit rounded-sm bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">Filters</h2>
        <button type="button" onClick={() => onChange(new URLSearchParams())}
          className="text-xs font-bold uppercase text-brand-strong hover:underline">
          Clear all
        </button>
      </div>

      <fieldset className="border-b border-slate-200 px-4 py-3">
        <legend className={headingClass + ' float-left w-full'}>Categories</legend>
        <div className="clear-both space-y-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="category" checked={selectedCategory === ''} onChange={() => update('category', '')}
              className="h-4 w-4 accent-brand-strong" />
            All categories
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="category" checked={selectedCategory === String(category.id)}
                onChange={() => update('category', String(category.id))} className="h-4 w-4 accent-brand-strong" />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>

      <form onSubmit={handlePrice} className="border-b border-slate-200 px-4 py-3">
        <p className={headingClass}>Price (₹)</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="minPrice" className="block text-xs text-slate-600">Min</label>
            <input id="minPrice" type="number" min="0" value={minRupees} onChange={(e) => setMinRupees(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <div className="flex-1">
            <label htmlFor="maxPrice" className="block text-xs text-slate-600">Max</label>
            <input id="maxPrice" type="number" min="0" value={maxRupees} onChange={(e) => setMaxRupees(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
          </div>
          <button type="submit" className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm hover:bg-slate-50">
            Go
          </button>
        </div>
      </form>

      <div className="px-4 py-3">
        <p className={headingClass}>Availability</p>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={params.get('inStock') === 'true'}
            onChange={(e) => update('inStock', e.target.checked ? 'true' : '')} className="h-4 w-4 accent-brand-strong" />
          In stock only
        </label>
      </div>
    </aside>
  );
}
