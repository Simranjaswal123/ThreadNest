import { Link } from 'react-router-dom';
import { formatMoney } from '../format.js';

export default function ProductCard({ product }) {
  const soldOut = product.total_stock === 0;

  return (
    <li className="overflow-hidden rounded-lg bg-white shadow">
      <Link to={'/products/' + product.id} className="block">
        <img src={product.image_url} alt={product.name} loading="lazy"
          className="aspect-square w-full bg-slate-200 object-cover" />
        <div className="p-3">
          <h2 className="font-semibold">{product.name}</h2>
          <p className="text-sm text-slate-600">{product.category_name}</p>
          <p className="mt-1 font-medium">{formatMoney(product.price_cents)}</p>
          {soldOut && <p className="mt-1 text-sm font-medium text-red-700">Sold out</p>}
        </div>
      </Link>
    </li>
  );
}
