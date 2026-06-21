/**
 * Authentication Middleware
 *
 * Validates JWT tokens from the Authorization header and attaches
 * the authenticated user to `req.user`.
 */

const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Authenticate incoming requests via Bearer token.
 *
 * Usage:
 *   router.get('/profile', authenticate, handler);
 */
const authenticate = async (req, res, next) => {
  try {
    // ── Extract token ──────────────────────────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Token is missing.' });
    }

    // ── Verify token ───────────────────────────────────────────────────────
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ error: 'Server authentication configuration error.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // ── Look up user ───────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        verified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'User associated with this token no longer exists.' });
    }

    // Attach user to the request object for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please log in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token. Please log in again.' });
    }

    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
};

module.exports = { authenticate };
