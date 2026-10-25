import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';

/**
 * Protect routes - verifies JWT from httpOnly cookie or Bearer token header and attaches user to req.user
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check secure httpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fallback to Authorization Bearer header for non-browser / mobile / API clients
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid or expired token'
    });
  }
};

/**
 * Optional auth - silently attaches req.user if a valid token is present in cookie or header.
 * Does NOT reject the request if no token is provided.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password').lean();
    if (user) req.user = user;
  } catch (_) {
    // Invalid token — just continue without attaching user
  }
  next();
};
