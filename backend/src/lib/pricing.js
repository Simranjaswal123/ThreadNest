import { shopConfig } from '../config/shop.js';

// Pure function: the same input always gives the same output, and it touches no database.
// Everything is a whole number of paise, so there are no rounding surprises with decimals.
//
// total = subtotal + shipping + tax
// - shipping: flat fee, free when subtotal >= threshold, nothing for an empty cart
// - tax: taxRatePercent of the subtotal (not of shipping), rounded half up to a whole paisa
export function calculateTotals(subtotalCents, rules = shopConfig) {
  if (subtotalCents <= 0) {
    return { subtotal_cents: 0, shipping_cents: 0, tax_cents: 0, total_cents: 0 };
  }

  let shippingCents = rules.shippingFeeCents;
  if (subtotalCents >= rules.freeShippingThresholdCents) {
    shippingCents = 0;
  }

  // Rounding half up with integers: add 50 (half of 100) before dividing by 100 and cutting off.
  const taxCents = Math.floor((subtotalCents * rules.taxRatePercent + 50) / 100);

  return {
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    tax_cents: taxCents,
    total_cents: subtotalCents + shippingCents + taxCents,
  };
}
