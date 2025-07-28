const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Role = require('../models/Role');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage } = require('../utils/cloudinary');

// Set up multer for avatar uploads (memory storage for Cloudinary)
const storage = multer.memoryStorage();

// File filter for avatars (images only)
const avatarFileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const mimetypeAllowed = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetypeAllowed) {
    return cb(null, true);
  } else {
    cb(new Error(`Avatar must be an image file (JPEG, PNG, GIF, WEBP)`), false);
  }
};

// Initialize avatar upload
const avatarUpload = multer({
  storage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for avatars
});

// Avatar upload error handling
const handleAvatarError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Avatar file too large. Maximum size is 2MB.'
      });
    }
  }
  
  if (err.message.includes('Avatar must be an image')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

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
    
    // Populate role and remove password from response
    await user.populate('role');
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
    const users = await User.find().select('-password').populate('role');

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
    const user = await User.findById(req.params.id).select('-password').populate('role');

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
    }).select('-password').populate('role');

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

// @route   POST /api/users/avatar
// @desc    Upload user avatar (doesn't save to media library)
// @access  Private (Own profile only)
router.post('/avatar', protect, avatarUpload.single('file'), handleAvatarError, async (req, res) => {
  try {
    console.log('Avatar upload route hit');
    console.log('Request file:', req.file ? 'File received' : 'No file');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload an avatar image'
      });
    }

    console.log('Avatar file details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary with avatar-specific folder
    console.log('Starting Cloudinary avatar upload...');
    const cloudinaryResult = await uploadImage(req.file.buffer, {
      folder: 'avatars',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
        { quality: 'auto', format: 'auto' }
      ]
    });

    // Update user's avatar field directly (no media library entry)
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: cloudinaryResult.url },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        url: cloudinaryResult.url,
        user: user
      }
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

module.exports = router;