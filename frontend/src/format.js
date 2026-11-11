// Money is stored as paise (integers). The screen shows rupees.
export function formatMoney(paise) {
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(text) {
  return new Date(text).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
