// An error we throw on purpose, with an HTTP status and a short machine-readable code.
// Example: throw new AppError(409, 'OUT_OF_STOCK', 'Only 1 left', { variantId: 7 });
// The errorHandler middleware turns it into the JSON error response.
export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
