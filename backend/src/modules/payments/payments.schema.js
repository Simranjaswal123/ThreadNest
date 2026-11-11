import { z } from 'zod';

// Only the card number is read. Unknown fields such as expiry and cvc are dropped by Zod
// and never saved.
export const payBodySchema = z.object({
  cardNumber: z.string().trim().min(12, 'Enter the card number').max(23),
});
