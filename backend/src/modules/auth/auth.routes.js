import express from 'express';
import { registerSchema, loginSchema } from './auth.schema.js';
import { registerUser, loginUser } from './auth.service.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginLimiter } from '../../middleware/loginLimiter.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../../lib/token.js';

// Routes only handle HTTP: check the input, call the service, send the answer.
const router = express.Router();

router.post('/auth/register', async (req, res) => {
  const body = registerSchema.parse(req.body);
  const user = await registerUser(body.email, body.password, body.full_name);

  // The new customer is logged in straight away.
  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.status(201).json({ user: user });
});

router.post('/auth/login', loginLimiter, async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await loginUser(body.email, body.password);

  res.cookie(COOKIE_NAME, signToken(user.id), cookieOptions);
  res.json({ user: user });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.json({ ok: true });
});

// Who am I? Used by the frontend after a page refresh.
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
