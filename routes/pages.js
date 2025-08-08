const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const { protect, authorize } = require('../middleware/auth');

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
    console.log('Fetching all pages...');
    const pages = await Page.find()
      .populate('author', 'name')
      .populate('parentPage', 'title slug')
      .sort({ order: 1, createdAt: -1 });

    console.log('Found pages:', pages.length);
    console.log('Pages data:', pages);

    res.json({
      success: true,
      count: pages.length,
      data: pages
    });
  } catch (err) {
    console.error('Error fetching pages:', err);
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

// @route   GET /api/pages/:id
// @desc    Get page by ID
// @access  Private (Editor+)
router.get('/:id', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
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
    console.error(`Error getting page ${req.params.id}:`, err);
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
    console.log('Creating page with data:', req.body);
    console.log('User:', req.user?.id);
    
    req.body.author = req.user.id;
    
    // Generate slug if not provided
    if (!req.body.slug && req.body.title) {
      let baseSlug = req.body.title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      
      let slug = baseSlug;
      let counter = 1;
      
      while (await Page.findOne({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      req.body.slug = slug;
    }

    const page = await Page.create(req.body);
    console.log('Page created successfully:', page);

    res.status(201).json({
      success: true,
      data: page
    });
  } catch (err) {
    console.error('Page creation error:', err);
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