const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tags
// @desc    Get all tags
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tags/:id
// @desc    Get single tag
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tags
// @desc    Create new tag
// @access  Private (Admin/Editor)
router.post('/', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const tag = await Tag.create(req.body);

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (err) {
    console.error(err);
    
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Tag already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tags/:id
// @desc    Update tag
// @access  Private (Admin/Editor)
router.put('/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/tags/:id
// @desc    Delete tag
// @access  Private (Editor and above)
router.delete('/:id', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    await tag.remove();

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