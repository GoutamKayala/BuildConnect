import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ApiError } from '../utils/asyncHandler.js';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const generateTokens = (user, deviceId = 'web-default') => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET || 'buildconnect_access_secret_super_secure_key_2026!@#$',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, deviceId },
    process.env.JWT_REFRESH_SECRET || 'buildconnect_refresh_secret_super_secure_key_2026!@#$',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );

  return { accessToken, refreshToken };
};

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, 'Authentication token missing. Please log in.');
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'buildconnect_access_secret_super_secure_key_2026!@#$'
    );

    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      throw new ApiError(401, 'User associated with this token no longer exists.');
    }

    if (user.status === 'SUSPENDED') {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Invalid or expired session. Please log in again.'));
    }
    next(error);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized request'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, `Access forbidden. Required role: ${roles.join(' or ')}`));
    }
    next();
  };
};
