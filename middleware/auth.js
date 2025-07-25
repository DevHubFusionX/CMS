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

    // Get user from the token
    req.user = await User.findById(decoded.id);

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
  return (req, res, next) => {
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
    
    // Get the actual role string (use legacyRole if role is ObjectId)
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    
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
  };
};

// Check if user owns the resource
exports.checkOwnership = (resourceField = 'author') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    
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
  };
};