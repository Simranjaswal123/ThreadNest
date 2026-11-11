import { z } from 'zod';

// optional text: an empty string counts as "not given"
const optionalText = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : null));

export const addressSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(100),
  line1: z.string().trim().min(1, 'Address line 1 is required').max(200),
  line2: optionalText,
  city: z.string().trim().min(1, 'City is required').max(100),
  postal_code: z.string().trim().min(3, 'Postal code is required').max(20),
  country: z.string().trim().min(1, 'Country is required').max(100),
  phone: optionalText,
});
