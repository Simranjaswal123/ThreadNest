import { AppError } from '../lib/AppError.js';

// Use after authenticate. Example: router.use(requireRole('admin')).
// The role comes from req.user (the database), never from the request body.
export function requireRole(role) {
  return function checkRole(req, res, next) {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Please log in');
    }
    if (req.user.role !== role) {
      throw new AppError(403, 'FORBIDDEN', 'You are not allowed to do this');
    }
    next();
  };
}
