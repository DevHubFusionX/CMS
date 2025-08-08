const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const { protect, authorize } = require('../middleware/auth');
const sanitizeHtml = require('sanitize-html');

// Sanitize HTML content
const sanitizeContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    allowedAttributes: {
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      'a': ['href', 'name', 'target', 'rel', 'class'],
      '*': ['class', 'id', 'style']
    }
  });
};

// @route   GET /api/pages
// @desc    Get all published pages
// @access  Public
router.get('/', async (req, res) => {
  try {
    const pages = await Page.find({ status: 'published' })
      .populate('author', 'name')
      .populate('parentPage', 'title slug')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pages/all
// @desc    Get all pages (admin)
// @access  Private (Editor+)
router.get('/all', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const pages = await Page.find()
      .populate('author', 'name')
      .populate('parentPage', 'title slug')
      .sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pages/slug/:slug
// @desc    Get page by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'name')
      .populate('parentPage', 'title slug');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/pages
// @desc    Create new page
// @access  Private (Editor+)
router.post('/', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    req.body.author = req.user.id;
    
    if (req.body.content) {
      req.body.content = sanitizeContent(req.body.content);
    }

    const page = await Page.create(req.body);

    res.status(201).json({
      success: true,
      data: page
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   PUT /api/pages/:id
// @desc    Update page
// @access  Private (Editor+)
router.put('/:id', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    if (req.body.content) {
      req.body.content = sanitizeContent(req.body.content);
    }

    const page = await Page.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: page
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   DELETE /api/pages/:id
// @desc    Delete page
// @access  Private (Admin+)
router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    await Page.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;