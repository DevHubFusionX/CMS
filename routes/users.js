const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin only)
router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    // If role is a string, find the corresponding role ObjectId
    if (req.body.role && typeof req.body.role === 'string') {
      const Role = require('../models/Role');
      const roleDoc = await Role.findOne({ name: req.body.role });
      if (roleDoc) {
        req.body.role = roleDoc._id;
        req.body.legacyRole = roleDoc.name;
      } else {
        // If role not found, set legacyRole and remove role field
        req.body.legacyRole = req.body.role;
        delete req.body.role;
      }
    }
    
    const user = await User.create(req.body);
    
    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin or own user)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Make sure user is admin or getting own profile
    const userRole = req.user.legacyRole || req.user.role;
    if (req.user.id !== req.params.id && userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this user'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own user)
router.put('/:id', protect, async (req, res) => {
  try {
    // Make sure user is admin or updating own profile
    const userRole = req.user.legacyRole || req.user.role;
    if (req.user.id !== req.params.id && userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // Don't allow role change unless admin
    if (req.body.role && userRole !== 'admin' && userRole !== 'super_admin') {
      delete req.body.role;
    }
    
    // If role is a string, find the corresponding role ObjectId
    if (req.body.role && typeof req.body.role === 'string') {
      const Role = require('../models/Role');
      const roleDoc = await Role.findOne({ name: req.body.role });
      if (roleDoc) {
        req.body.role = roleDoc._id;
        req.body.legacyRole = roleDoc.name;
      } else {
        // If role not found, set legacyRole and remove role field
        req.body.legacyRole = req.body.role;
        delete req.body.role;
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;