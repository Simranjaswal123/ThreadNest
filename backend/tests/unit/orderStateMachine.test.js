import { describe, it, expect } from 'vitest';
import { ORDER_STATUSES, canTransition, nextStatuses } from '../../src/lib/orderStateMachine.js';

// The legal moves, written out by hand here, separately from the code under test.
const legalMoves = [
  'placed->paid',
  'placed->cancelled',
  'paid->packed',
  'paid->cancelled',
  'packed->shipped',
  'packed->cancelled',
  'shipped->delivered',
];

describe('canTransition', () => {
  // Checks every pair of statuses: 6 x 6 = 36 cases.
  for (const from of ORDER_STATUSES) {
    for (const to of ORDER_STATUSES) {
      const expected = legalMoves.includes(from + '->' + to);
      it(from + ' -> ' + to + ' is ' + (expected ? 'allowed' : 'not allowed'), () => {
        expect(canTransition(from, to)).toBe(expected);
      });
    }
  }

  it('does not allow anything from delivered', () => {
    expect(nextStatuses('delivered')).toEqual([]);
  });

  it('does not allow anything from cancelled', () => {
    expect(nextStatuses('cancelled')).toEqual([]);
  });

  it('refuses an unknown status', () => {
    expect(canTransition('nonsense', 'paid')).toBe(false);
  });
});

describe('nextStatuses', () => {
  it('lists the legal next statuses', () => {
    expect(nextStatuses('placed')).toEqual(['paid', 'cancelled']);
    expect(nextStatuses('shipped')).toEqual(['delivered']);
  });
});
