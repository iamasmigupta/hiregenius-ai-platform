/**
 * Wrapper for async route handlers.
 * Catches errors from async functions and passes them to the 'next' middleware,
 * which will be our centralized error handler.
 * @param {Function} fn - The async route handler function to wrap.
 * @returns {Function} An Express route handler function.
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;