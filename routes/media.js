const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Media = require('../models/Media');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

// Set up multer for memory storage (Cloudinary)
const storage = multer.memoryStorage();

// File filter with enhanced security
const fileFilter = (req, file, cb) => {
  // Strict whitelist of allowed file types
  const allowedMimeTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf']
  };
  
  const mimetype = file.mimetype.toLowerCase();
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Check if mimetype is allowed
  if (!allowedMimeTypes[mimetype]) {
    return cb(new Error(`File type not allowed: ${mimetype}`), false);
  }
  
  // Check if extension matches mimetype
  if (!allowedMimeTypes[mimetype].includes(extension)) {
    return cb(new Error(`File extension ${extension} doesn't match mimetype ${mimetype}`), false);
  }
  
  // Additional security checks
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new Error('Invalid filename'), false);
  }
  
  cb(null, true);
};

// Initialize upload with stricter limits
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit (reduced from 10MB)
    files: 1, // Only 1 file per request
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB field size limit
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name. Use "file" as the field name.'
      });
    }
  }
  
  if (err.message.includes('File type not supported')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// @route   POST /api/media
// @desc    Upload media file
// @access  Private
router.post('/', protect, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('Media upload route hit');
    console.log('Request file:', req.file ? 'File received' : 'No file');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary
    console.log('Starting Cloudinary upload...');
    const cloudinaryResult = await uploadImage(req.file.buffer);

    // Create media record
    const media = await Media.create({
      name: req.body.name || req.file.originalname,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      path: cloudinaryResult.url,
      url: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      size: cloudinaryResult.size,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height,
      format: cloudinaryResult.format,
      uploadedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: media
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   GET /api/media
// @desc    Get all media files
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const media = await Media.find()
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: media.length,
      data: media
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/media/:id
// @desc    Get single media file
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('uploadedBy', 'name');

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    res.status(200).json({
      success: true,
      data: media
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/media/:id
// @desc    Delete media file
// @access  Private (Admin or uploader)
router.delete('/:id', protect, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Check permissions: uploader, author+, or users with delete_own_media/delete_all_media
    const user = await req.user.populate('role');
    const userRole = user.role?.name || user.legacyRole;
    const hasDeleteAllMedia = user.role?.permissions?.includes('delete_all_media');
    const hasDeleteOwnMedia = user.role?.permissions?.includes('delete_own_media');
    
    const canDelete = 
      hasDeleteAllMedia || // Admin/Super Admin can delete any media
      (hasDeleteOwnMedia && media.uploadedBy.toString() === req.user.id) || // Own media with permission
      media.uploadedBy.toString() === req.user.id || // Own media (fallback)
      ['admin', 'super_admin'].includes(userRole); // Legacy role check
    
    if (!canDelete) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this media'
      });
    }

    // Delete from Cloudinary
    if (media.publicId) {
      await deleteImage(media.publicId);
    }

    // Delete from database
    await media.deleteOne();

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