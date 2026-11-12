import { Link } from 'react-router-dom';
import { formatMoney } from '../format.js';

// One product in the shop grid: a tall picture that zooms a little on hover, then the details.
export default function ProductCard({ product }) {
  const soldOut = product.total_stock === 0;
  const fewLeft = product.total_stock > 0 && product.total_stock <= 5;

  return (
    <li className="group overflow-hidden rounded-sm bg-white transition hover:shadow-lg">
      <Link to={'/products/' + product.id} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold uppercase tracking-widest text-slate-800">
              Sold out
            </span>
          )}
          {fewLeft && (
            <span className="absolute left-2 top-2 rounded-sm bg-white px-2 py-0.5 text-xs font-bold text-brand-strong shadow">
              Only {product.total_stock} left
            </span>
          )}
        </div>
        <div className="px-3 pb-3 pt-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-900">{product.category_name}</p>
          <h2 className="truncate text-sm text-slate-600 group-hover:text-link-hover">{product.name}</h2>
          <p className="mt-1 text-base font-bold text-slate-900">{formatMoney(product.price_cents)}</p>
        </div>
      </Link>
    </li>
  );
}
