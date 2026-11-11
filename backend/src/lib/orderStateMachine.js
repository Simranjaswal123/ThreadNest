// Rule 3: the allowed order status changes, in one place and as plain data.
// placed -> paid -> packed -> shipped -> delivered, and cancel from placed, paid or packed.
// delivered and cancelled are final: nothing leaves them.
export const ORDER_STATUSES = ['placed', 'paid', 'packed', 'shipped', 'delivered', 'cancelled'];

const allowedMoves = {
  placed: ['paid', 'cancelled'],
  paid: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

// Pure function: true if an order may move from one status to another.
export function canTransition(from, to) {
  const moves = allowedMoves[from];
  if (!moves) {
    return false;
  }
  return moves.includes(to);
}

// The statuses an order can move to from here (used to show only legal buttons).
export function nextStatuses(from) {
  return allowedMoves[from] || [];
}
