import { ZodError } from 'zod';
import { AppError } from '../lib/AppError.js';

// Every error response has the same shape: { error: { code, message, details } }.
function sendError(res, status, code, message, details = null) {
  res.status(status).json({ error: { code: code, message: message, details: details } });
}

// Runs when no route matched the request.
export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', 'Route not found');
}

// Express knows this is an error handler because it has four parameters.
export function errorHandler(err, req, res, next) {
  // Zod throws this when a body, query or params check fails.
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 400, 'VALIDATION_ERROR', 'Some fields are not valid', details);
  }

  // Errors we threw ourselves on purpose.
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }

  // The request body was not valid JSON.
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
  }

  // Anything else is a bug. Log it, but do not leak details to the client.
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
}
