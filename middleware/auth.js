const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the right format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token with populated role
    const user = await User.findById(decoded.id).populate('role');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if token is blacklisted
    const isBlacklisted = user.tokenBlacklist.some(entry => entry.token === token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked'
      });
    }
    
    req.user = user;
    req.token = token;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    // Allow visitor access for public routes
    if (roles.includes('visitor') && !req.user) {
      return next();
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Get user with populated role
      const user = await User.findById(req.user.id || req.user._id).populate('role');
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned'
        });
      }
      
      const userRole = user.role.name;
      
      // Super admin has access to everything
      if (userRole === 'super_admin') {
        return next();
      }
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `User role ${userRole} is not authorized to access this route`
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Check if user owns the resource
exports.checkOwnership = (resourceField = 'author') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    try {
      const user = await User.findById(req.user.id || req.user._id).populate('role');
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'No role assigned'
        });
      }
      
      const userRole = user.role.name;
      
      // Admin and super_admin can access everything
      if (userRole === 'admin' || userRole === 'super_admin') {
        return next();
      }
      
      // Check ownership for other roles
      if (req.resource && req.resource[resourceField] && req.resource[resourceField].toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};