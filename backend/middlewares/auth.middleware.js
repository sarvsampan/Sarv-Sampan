import { verifyToken } from '../utils/jwt.js';
import { supabase } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Access denied.'
      });
    }

    const decoded = verifyToken(token);
    req.adminId = decoded.adminId;
    req.adminRole = decoded.role;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication - allows both authenticated and guest users
 * Sets req.user if token is valid, otherwise continues without user
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = verifyToken(token);
        req.user = { id: decoded.userId, email: decoded.email };
      } catch (error) {
        // Invalid token, continue as guest
        req.user = null;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
