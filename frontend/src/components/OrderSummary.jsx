import { formatMoney } from '../format.js';

// The lines, the totals and the address of one order. Used by the confirmation and detail pages.
export default function OrderSummary({ order }) {
  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg bg-white shadow">
        {order.items.map((item) => (
          <li key={item.variant_id} className="flex flex-wrap justify-between gap-2 p-3">
            <span>
              {item.product_name} <span className="text-sm text-slate-600">({item.sku}) × {item.quantity}</span>
            </span>
            <span>{formatMoney(item.unit_price_cents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <dl className="ml-auto max-w-sm space-y-1 rounded-lg bg-white p-4 shadow">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(order.subtotal_cents)}</dd></div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>{order.shipping_cents === 0 ? 'Free' : formatMoney(order.shipping_cents)}</dd>
        </div>
        <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(order.tax_cents)}</dd></div>
        <div className="flex justify-between border-t pt-2 text-lg font-bold">
          <dt>Total</dt><dd>{formatMoney(order.total_cents)}</dd>
        </div>
      </dl>

      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="font-semibold">Shipping address</h2>
        <p className="whitespace-pre-line">{order.shipping_address}</p>
      </div>
    </div>
  );
}
