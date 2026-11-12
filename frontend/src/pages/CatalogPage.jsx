import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import Filters from '../components/Filters.jsx';
import Pagination from '../components/Pagination.jsx';
import ProductCard from '../components/ProductCard.jsx';

// "minPrice=50000" becomes "₹500".
function rupees(paiseText) {
  return '₹' + Number(paiseText) / 100;
}

export default function CatalogPage() {
  // The filters live in the URL, so a refresh or a shared link keeps them.
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const query = searchParams.toString();

  useEffect(() => {
    api.get('/categories').then((data) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    // "ignore" stops an old, slow answer from replacing a newer one.
    let ignore = false;
    setLoading(true);
    setError('');
    api
      .get('/products?' + query)
      .then((data) => {
        if (!ignore) setResult(data);
      })
      .catch((err) => {
        if (!ignore) setError(errorText(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [query, reloadKey]);

  // Copies the URL, changes it, and always goes back to page 1 (except when paging).
  function changeParams(change) {
    const next = new URLSearchParams(searchParams);
    change(next);
    setSearchParams(next);
  }

  function goToPage(page) {
    changeParams((next) => next.set('page', String(page)));
    window.scrollTo(0, 0);
  }

  function changeSort(event) {
    changeParams((next) => {
      if (event.target.value === 'newest') {
        next.delete('sort');
      } else {
        next.set('sort', event.target.value);
      }
      next.delete('page');
    });
  }

  function removeFilter(names) {
    changeParams((next) => {
      for (const name of names) {
        next.delete(name);
      }
      next.delete('page');
    });
  }

  // The filters that are switched on, shown as small chips that can be removed.
  const q = searchParams.get('q');
  const categoryId = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const category = categories.find((c) => String(c.id) === categoryId);
  const chips = [];
  if (q) chips.push({ label: '"' + q + '"', names: ['q'] });
  if (categoryId) chips.push({ label: category ? category.name : 'Category', names: ['category'] });
  if (minPrice && maxPrice) chips.push({ label: rupees(minPrice) + ' to ' + rupees(maxPrice), names: ['minPrice', 'maxPrice'] });
  if (minPrice && !maxPrice) chips.push({ label: rupees(minPrice) + ' and above', names: ['minPrice'] });
  if (!minPrice && maxPrice) chips.push({ label: 'Up to ' + rupees(maxPrice), names: ['maxPrice'] });
  if (searchParams.get('inStock') === 'true') chips.push({ label: 'In stock', names: ['inStock'] });

  let title = 'All products';
  if (category) title = category.name;
  if (q) title = 'Results for "' + q + '"';

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-600">
        <Link to="/" className="hover:underline">Home</Link> <span aria-hidden="true">/</span>{' '}
        <span className="font-semibold text-slate-900">{title}</span>
      </nav>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">
          {title}{' '}
          {result && <span className="text-base font-normal text-slate-600">- {result.total} items</span>}
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-slate-700">Sort by</label>
          <select id="sort" value={searchParams.get('sort') || 'newest'} onChange={changeSort}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm">
            <option value="newest">What's new</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.label}>
              <button type="button" onClick={() => removeFilter(chip.names)}
                className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm hover:border-slate-500">
                {chip.label} <span aria-hidden="true" className="text-slate-500">✕</span>
                <span className="sr-only">(remove this filter)</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Filters key={query} params={searchParams} categories={categories} onChange={setSearchParams} />

        <section aria-label="Products">
          <div aria-live="polite">
            {loading && (
              <div>
                <p role="status" className="sr-only">Loading products...</p>
                <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <li key={n} className="animate-pulse rounded-sm bg-white">
                      <div className="aspect-[4/5] bg-slate-200" />
                      <div className="space-y-2 p-3">
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!loading && error && (
              <div role="alert" className="rounded-sm border border-red-300 bg-white p-4 text-red-800">
                {error}
                <button onClick={() => setReloadKey(reloadKey + 1)} className="ml-3 font-medium text-link underline">
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && result && result.items.length === 0 && (
              <div className="rounded-sm bg-white p-10 text-center">
                <p className="text-lg font-bold">We couldn't find any matches</p>
                <p className="mt-1 text-slate-600">Try another search word or remove some filters.</p>
                <button onClick={() => setSearchParams(new URLSearchParams())}
                  className="mt-4 rounded-md bg-brand-strong px-5 py-2 font-bold text-white hover:bg-brand-deep">
                  Show all products
                </button>
              </div>
            )}
          </div>

          {!loading && !error && result && result.items.length > 0 && (
            <>
              <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </ul>
              <Pagination page={result.page} totalPages={result.totalPages} onChange={goToPage} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
