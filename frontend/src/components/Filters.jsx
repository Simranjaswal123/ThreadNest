import { useState } from 'react';

const inputClass = 'w-full rounded border border-slate-400 px-3 py-2';

// The filter form. The page gives it the current URL params and a function to call on "Apply".
// The page re-creates this component whenever the URL changes (see "key" in CatalogPage),
// so the starting values below always match the URL.
export default function Filters({ params, categories, onApply }) {
  const [q, setQ] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [sort, setSort] = useState(params.get('sort') || 'newest');
  const [inStock, setInStock] = useState(params.get('inStock') === 'true');
  // The URL holds paise but people type rupees.
  const [minRupees, setMinRupees] = useState(params.get('minPrice') ? Number(params.get('minPrice')) / 100 : '');
  const [maxRupees, setMaxRupees] = useState(params.get('maxPrice') ? Number(params.get('maxPrice')) / 100 : '');

  function handleSubmit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (category) next.set('category', category);
    if (minRupees !== '') next.set('minPrice', String(Math.round(Number(minRupees) * 100)));
    if (maxRupees !== '') next.set('maxPrice', String(Math.round(Number(maxRupees) * 100)));
    if (sort !== 'newest') next.set('sort', sort);
    if (inStock) next.set('inStock', 'true');
    onApply(next);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <label htmlFor="q" className="mb-1 block text-sm font-medium">Search</label>
        <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="minPrice" className="mb-1 block text-sm font-medium">Min price (₹)</label>
        <input id="minPrice" type="number" min="0" value={minRupees} onChange={(e) => setMinRupees(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium">Max price (₹)</label>
        <input id="maxPrice" type="number" min="0" value={maxRupees} onChange={(e) => setMaxRupees(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor="sort" className="mb-1 block text-sm font-medium">Sort by</label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-6">
        <input id="inStock" type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="h-4 w-4" />
        <label htmlFor="inStock" className="text-sm">In stock only</label>
        <button type="submit" className="ml-auto rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
          Apply
        </button>
        <button type="button" onClick={() => onApply(new URLSearchParams())}
          className="rounded border border-slate-500 px-4 py-2 hover:bg-slate-100">
          Reset
        </button>
      </div>
    </form>
  );
}
