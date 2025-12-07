/**
 * Async handler middleware to wrap async route handlers
 * Catches any errors and passes them to the error handling middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
