const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attaches req.user if a valid token is present, but does NOT block if missing
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
      if (user && user.isActive) req.user = user;
    }
  } catch (_) {
    // Token invalid or missing — that's fine, just continue without user
  }
  next();
};

module.exports = { optionalAuth };
