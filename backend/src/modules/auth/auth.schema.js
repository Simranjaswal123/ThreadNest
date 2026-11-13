import { z } from 'zod';

// Zod checks the shape of the request before our code uses it.
// Unknown fields (like "role") are dropped, so nobody can sign up as admin.
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  // bcrypt only uses the first 72 bytes of a password, so we cap it there.
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  full_name: z.string().trim().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// The token in a reset link is 64 hexadecimal characters (32 random bytes).
export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, 'This reset link is not valid'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});
