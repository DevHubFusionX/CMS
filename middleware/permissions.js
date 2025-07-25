const User = require('../models/User');
const Role = require('../models/Role');

// Check if user has specific permission
const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.'
        });
      }

      // Get user with role populated
      const user = await User.findById(req.user.id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No role assigned.'
        });
      }

      // Check if user's role has the required permission
      if (!user.role.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error checking permissions'
      });
    }
  };
};

// Check if user has any of the specified permissions
const hasAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.'
        });
      }

      const user = await User.findById(req.user.id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No role assigned.'
        });
      }

      // Check if user has any of the required permissions
      const hasPermission = permissions.some(permission => 
        user.role.permissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissions.join(' or ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error checking permissions'
      });
    }
  };
};

// Check minimum role level
const hasMinimumRole = (minimumLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No user found.'
        });
      }

      const user = await User.findById(req.user.id).populate('role');
      
      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. No role assigned.'
        });
      }

      if (user.role.level < minimumLevel) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient role level.'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Server error checking role level'
      });
    }
  };
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasMinimumRole
};