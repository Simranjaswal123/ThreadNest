// A pretend payment provider for the demo. No real money, no real card data.
// 4242 4242 4242 4242 is approved. 4000 0000 0000 0002 is declined.
// Any other number is also declined, so only the two test cards are meaningful.
export function chargeCard(cardNumber) {
  // Remove spaces and dashes so "4242 4242 4242 4242" and "4242-4242-..." both work.
  const digits = String(cardNumber).replace(/[\s-]/g, '');

  if (digits === '4242424242424242') {
    return { approved: true, message: 'Payment approved' };
  }
  if (digits === '4000000000000002') {
    return { approved: false, message: 'Your card was declined' };
  }
  return { approved: false, message: 'Unknown test card. Use 4242 4242 4242 4242 to pay.' };
}
