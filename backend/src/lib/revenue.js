// Revenue = the total of orders that were paid and not cancelled.
// A "placed" order is not paid yet, and a "cancelled" order was refunded, so neither counts.
// The dashboard and the customers list both use this one list.
export const REVENUE_STATUSES = ['paid', 'packed', 'shipped', 'delivered'];
