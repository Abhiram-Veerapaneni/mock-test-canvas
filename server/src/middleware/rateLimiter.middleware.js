import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

/**
 * Extracts a unique user identifier for rate limiting.
 * Prioritizes the authenticated user's ID (via req.user or verified JWT token),
 * and falls back to IP address for unauthenticated guest requests.
 */
export const getRateLimitKey = (req) => {
  // 1. Check if user is already attached by auth middleware
  if (req.user?._id || req.user?.id) {
    return `user_${req.user._id || req.user.id}`;
  }

  // 2. Extract and verify JWT token from cookies or authorization header
  try {
    let token = req.cookies?.token;
    if (!token && req.headers?.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      if (decoded?.id) {
        return `user_${decoded.id}`;
      }
    }
  } catch (_) {
    // Token is invalid, expired, or malformed — proceed to fallback
  }

  // 3. Fallback to client IP address for unauthenticated requests
  return `ip_${req.ip}`;
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user (or IP for guests) to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Check authenticated user first
    if (req.user?._id || req.user?.id) {
      return `auth_user_${req.user._id || req.user.id}`;
    }
    // Rate limit login/register attempts by account email if provided
    const email = req.body?.email?.toString().trim().toLowerCase();
    if (email) {
      return `auth_email_${email}`;
    }
    return getRateLimitKey(req);
  },
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  }
});
