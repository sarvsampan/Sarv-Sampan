import { verifyToken } from '../utils/jwt.js';

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login to continue.'
      });
    }

    const decoded = verifyToken(token);

    // For user tokens, set req.user
    if (decoded.userId) {
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,  // For compatibility with existing controllers
        email: decoded.email,
        name: decoded.name
      };
    } else {
      // If no userId in token, it might be an admin token
      return res.status(401).json({
        success: false,
        message: 'Invalid token type. Please login as a user.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional authentication - for routes that work with or without login
export const optionalAuthenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = verifyToken(token);
      if (decoded.userId) {
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,  // For compatibility with existing controllers
          email: decoded.email,
          name: decoded.name
        };
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};
