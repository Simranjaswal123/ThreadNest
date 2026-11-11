// Shop rules in one place. Money is in paise (1 rupee = 100 paise).
export const shopConfig = {
  // Flat shipping fee: Rs 99.
  shippingFeeCents: 9900,
  // Shipping is free when the subtotal is at least Rs 999.
  freeShippingThresholdCents: 99900,
  // One fixed tax rate for everything: 5 percent.
  taxRatePercent: 5,
  // Most items of one variant in the cart.
  maxQuantityPerLine: 10,
};
