import { describe, it, expect } from 'vitest';
import { calculateTotals } from '../../src/lib/pricing.js';

// Fixed rules, so the tests do not change when the shop config changes.
const rules = { shippingFeeCents: 9900, freeShippingThresholdCents: 99900, taxRatePercent: 5 };

describe('calculateTotals', () => {
  it('returns zeros for an empty cart', () => {
    expect(calculateTotals(0, rules)).toEqual({
      subtotal_cents: 0,
      shipping_cents: 0,
      tax_cents: 0,
      total_cents: 0,
    });
  });

  it('adds the flat shipping fee below the free-shipping threshold', () => {
    const result = calculateTotals(50000, rules);

    expect(result.shipping_cents).toBe(9900);
  });

  it('makes shipping free exactly at the threshold', () => {
    const result = calculateTotals(99900, rules);

    expect(result.shipping_cents).toBe(0);
  });

  it('charges shipping one paisa below the threshold', () => {
    const result = calculateTotals(99899, rules);

    expect(result.shipping_cents).toBe(9900);
  });

  it('calculates tax on the subtotal only', () => {
    const result = calculateTotals(50000, rules);

    // 5 percent of 50000
    expect(result.tax_cents).toBe(2500);
  });

  it('rounds tax half up', () => {
    // 5 percent of 10 paise is 0.5, which rounds up to 1
    expect(calculateTotals(10, rules).tax_cents).toBe(1);
    // 5 percent of 9 paise is 0.45, which rounds down to 0
    expect(calculateTotals(9, rules).tax_cents).toBe(0);
  });

  it('makes the total equal to subtotal plus shipping plus tax', () => {
    const result = calculateTotals(123457, rules);

    expect(result.total_cents).toBe(result.subtotal_cents + result.shipping_cents + result.tax_cents);
  });

  it('always returns whole numbers', () => {
    const result = calculateTotals(33333, rules);

    expect(Number.isInteger(result.tax_cents)).toBe(true);
    expect(Number.isInteger(result.total_cents)).toBe(true);
  });
});
