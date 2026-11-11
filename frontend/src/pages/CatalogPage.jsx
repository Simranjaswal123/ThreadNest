import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorText } from '../api.js';
import Filters from '../components/Filters.jsx';
import Pagination from '../components/Pagination.jsx';
import ProductCard from '../components/ProductCard.jsx';

export default function CatalogPage() {
  // The filters live in the URL, so a refresh or a shared link keeps them.
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const query = searchParams.toString();

  useEffect(() => {
    api
      .get('/categories')
      .then((data) => setCategories(data.categories))
      .catch(() => {});
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
  }, [query]);

  function goToPage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
    window.scrollTo(0, 0);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Shop</h1>
      <Filters key={query} params={searchParams} categories={categories} onApply={setSearchParams} />

      <div className="mt-6" aria-live="polite">
        {loading && <p role="status">Loading products...</p>}

        {error && (
          <div role="alert" className="rounded bg-red-50 p-3 text-red-800">
            {error}
            <button onClick={() => setSearchParams(new URLSearchParams(searchParams))} className="ml-3 underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && result && result.items.length === 0 && (
          <p>
            No products match your search.{' '}
            <button onClick={() => setSearchParams(new URLSearchParams())} className="text-indigo-700 underline">
              Clear filters
            </button>
          </p>
        )}
      </div>

      {!error && result && result.items.length > 0 && (
        <>
          <p className="mb-3 text-sm text-slate-600">{result.total} products</p>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
          <Pagination page={result.page} totalPages={result.totalPages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
