/**
 * Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err.stack || err.message);
  
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred while processing the request',
  });
}
