/**
 * Global Error Handler Middleware
 *
 * Catches all errors thrown or forwarded via next(err) and returns
 * consistent JSON responses. Includes special handling for Prisma
 * client errors.
 */

const { Prisma } = require('@prisma/client');

/**
 * Express error-handling middleware (4-argument signature).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = undefined;

  // ── Prisma Known Request Errors ────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        statusCode = 409;
        const fields = err.meta?.target;
        message = `A record with this ${
          Array.isArray(fields) ? fields.join(', ') : 'value'
        } already exists.`;
        break;
      }

      case 'P2025': {
        // Record not found
        statusCode = 404;
        message = err.meta?.cause || 'The requested record was not found.';
        break;
      }

      case 'P2003': {
        // Foreign key constraint failure
        statusCode = 400;
        message = 'Related record not found. Please check your references.';
        break;
      }

      case 'P2014': {
        // Required relation violation
        statusCode = 400;
        message = 'This operation violates a required relation constraint.';
        break;
      }

      default: {
        statusCode = 400;
        message = 'A database error occurred.';
        break;
      }
    }
  }

  // ── Prisma Validation Errors ───────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided. Please check your input.';
  }

  // ── JSON Syntax Errors (malformed body) ────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body.';
  }

  // ── Log Server Errors ─────────────────────────────────────────────────
  if (statusCode >= 500) {
    console.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // ── Send Response ─────────────────────────────────────────────────────
  const response = {
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 && {
      stack: err.stack,
    }),
  };

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
