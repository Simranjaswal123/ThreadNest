import { formatMoney } from '../format.js';

// The lines, the totals and the address of one order. Used by the confirmation and detail pages.
export default function OrderSummary({ order }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_300px]">
      <section className="rounded-sm bg-white p-4 shadow-sm" aria-label="Items">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide">Items</h2>
        <ul className="divide-y divide-slate-200">
          {order.items.map((item) => (
            <li key={item.variant_id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {item.product_name}
                <span className="block text-xs text-slate-600">SKU {item.sku} · Qty {item.quantity} · {formatMoney(item.unit_price_cents)} each</span>
              </span>
              <span className="font-medium">{formatMoney(item.unit_price_cents * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-4">
        <dl className="space-y-1 rounded-sm bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between"><dt>Items</dt><dd>{formatMoney(order.subtotal_cents)}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{order.shipping_cents === 0 ? <span className="text-green-700">FREE</span> : formatMoney(order.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between"><dt>Tax</dt><dd>{formatMoney(order.tax_cents)}</dd></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
            <dt>Order total</dt><dd>{formatMoney(order.total_cents)}</dd>
          </div>
        </dl>

        <div className="rounded-sm bg-white p-4 text-sm shadow-sm">
          <h2 className="mb-1 font-bold">Delivery address</h2>
          <p className="whitespace-pre-line text-slate-700">{order.shipping_address}</p>
        </div>
      </div>
    </div>
  );
}
