/**
 * Request Validation Middleware Factory
 *
 * Creates Express middleware that validates `req.body` against a
 * declarative schema object. Returns 400 with detailed error messages
 * if validation fails.
 *
 * Schema format:
 * {
 *   fieldName: {
 *     type:      'string' | 'number' | 'boolean' | 'object' | 'array',
 *     required:  true | false,
 *     minLength: <number>,    // strings only
 *     maxLength: <number>,    // strings only
 *     min:       <number>,    // numbers only
 *     max:       <number>,    // numbers only
 *     pattern:   <RegExp>,    // strings only
 *     enum:      [values],    // allowed values
 *     message:   'Custom error message',
 *   }
 * }
 *
 * Usage:
 *   const { validate } = require('../middleware/validate');
 *
 *   const registerSchema = {
 *     email:    { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
 *     password: { type: 'string', required: true, minLength: 8 },
 *   };
 *
 *   router.post('/register', validate(registerSchema), controller);
 */

/**
 * Build a validation middleware from a schema object.
 *
 * @param {Record<string, object>} schema  Field rules keyed by field name.
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      // ── Required check ──────────────────────────────────────────────────
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} is required.`);
        continue; // Skip further checks for this field
      }

      // Skip remaining validations if value not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // ── Type check ──────────────────────────────────────────────────────
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(rules.message || `${field} must be of type ${rules.type}.`);
          continue;
        }
      }

      // ── String validations ──────────────────────────────────────────────
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(
            rules.message || `${field} must be at least ${rules.minLength} characters long.`
          );
        }

        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(
            rules.message || `${field} must be at most ${rules.maxLength} characters long.`
          );
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(rules.message || `${field} has an invalid format.`);
        }
      }

      // ── Number validations ──────────────────────────────────────────────
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(rules.message || `${field} must be at least ${rules.min}.`);
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push(rules.message || `${field} must be at most ${rules.max}.`);
        }
      }

      // ── Enum validation ─────────────────────────────────────────────────
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(
          rules.message || `${field} must be one of: ${rules.enum.join(', ')}.`
        );
      }
    }

    // ── Return errors or proceed ──────────────────────────────────────────
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    next();
  };
};

module.exports = { validate };
