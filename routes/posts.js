const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const sanitizeHtml = require('sanitize-html');
const logger = require('../utils/logger');

// Sanitize HTML content
const sanitizeContent = (content) => {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      'a': ['href', 'name', 'target', 'rel', 'class'],
      '*': ['class', 'id', 'style']
    }
  });
};

// @route   GET /api/posts
// @desc    Get all published posts with filtering, sorting, and pagination
// @access  Public (Visitor and above)
router.get('/', authorize('visitor', 'subscriber', 'contributor', 'author', 'editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      category,
      tag,
      search,
      language = 'en'
    } = req.query;
    
    // Build query
    const query = { 
      status: 'published',
      language
    };
    
    // Add category filter if provided
    if (category) {
      query.categories = category;
    }
    
    // Add tag filter if provided
    if (tag) {
      query.tags = tag;
    }
    
    // Add search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('categories', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
  } catch (err) {
    logger.error(`Error getting posts: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/my
// @desc    Get current user's posts (including drafts)
// @access  Private (Contributor and above)
router.get('/my', protect, authorize('contributor', 'author', 'editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      status,
      search,
      language
    } = req.query;
    
    // Build query - only show user's own posts
    const query = {
      author: req.user.id
    };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add language filter if provided
    if (language) {
      query.language = language;
    }
    
    // Add search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('categories', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
  } catch (err) {
    logger.error(`Error getting user posts: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/all
// @desc    Get all posts (including drafts) with filtering and pagination
// @access  Private (Editor and above)
router.get('/all', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sort = '-createdAt',
      status,
      author,
      search,
      language
    } = req.query;
    
    // Build query
    const query = {};
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Add author filter if provided
    if (author) {
      query.author = author;
    }
    
    // Add language filter if provided
    if (language) {
      query.language = language;
    }
    
    // Add search filter if provided
    if (search) {
      query.$text = { $search: search };
    }
    
    // Execute query with pagination
    const posts = await Post.find(query)
      .populate('author', 'name avatar')
      .populate('categories', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      
    // Get total count for pagination
    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: posts
    });
  } catch (err) {
    logger.error(`Error getting all posts: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/scheduled
// @desc    Get all scheduled posts
// @access  Private (Admin/Editor)
router.get('/scheduled', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const posts = await Post.find({ status: 'scheduled' })
      .populate('author', 'name avatar')
      .sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    logger.error(`Error getting scheduled posts: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/slug/:slug
// @desc    Get post by slug
// @access  Public
router.get('/slug/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published' })
      .populate('author', 'name avatar bio')
      .populate('categories', 'name slug');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    logger.error(`Error getting post by slug ${req.params.slug}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Public for published, Private for drafts
router.get('/:id', async (req, res) => {
  // Try to get user from token if provided, but don't require it
  let user = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      req.user = user;
    } catch (err) {
      // Token invalid, but continue as public user
    }
  }
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar bio')
      .populate('categories', 'name slug')
      .populate('translations.postId', 'title language slug');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if post is draft/scheduled and user is authorized
    if (post.status === 'draft' || post.status === 'scheduled') {
      // Check if user is logged in
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this post'
        });
      }
      
      // Check if user is author, admin or editor
      const userRole = user.legacyRole || user.role;
      if (
        userRole !== 'admin' &&
        userRole !== 'super_admin' &&
        userRole !== 'editor' &&
        post.author._id.toString() !== user._id.toString()
      ) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized to access this post'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    logger.error(`Error getting post ${req.params.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/:id/versions
// @desc    Get post version history
// @access  Private
router.get('/:id/versions', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Make sure user is post author or admin/editor
    const userRole = req.user.legacyRole || req.user.role;
    if (
      post.author.toString() !== req.user.id &&
      userRole !== 'admin' &&
      userRole !== 'super_admin' &&
      userRole !== 'editor'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view version history'
      });
    }

    res.status(200).json({
      success: true,
      count: post.versions.length,
      data: post.versions
    });
  } catch (err) {
    logger.error(`Error getting post versions ${req.params.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private (Contributor and above)
router.post('/', protect, authorize('contributor', 'author', 'editor', 'admin', 'super_admin'), async (req, res) => {
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    
    // Contributors can only create drafts
    if (userRole === 'contributor' && req.body.status !== 'draft') {
      req.body.status = 'draft';
    }
  try {
    // Add author to req.body
    req.body.author = req.user.id;
    
    // Sanitize HTML content
    if (req.body.content) {
      req.body.content = sanitizeContent(req.body.content);
    }
    
    // Create initial version
    if (req.body.content) {
      req.body.versions = [{
        content: req.body.content,
        createdAt: Date.now(),
        createdBy: req.user.id
      }];
    }

    const post = await Post.create(req.body);
    
    // Populate post data for notification
    await post.populate('author', 'name avatar');
    
    // Emit notification to editors when a new post is created
    const io = req.app.get('io');
    if (io) {
      io.to('editor').to('admin').to('super_admin').emit('new_post_created', {
        id: post._id,
        title: post.title,
        author: post.author,
        status: post.status,
        createdAt: post.createdAt,
        message: `New post "${post.title}" created by ${post.author.name}`
      });
    }

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    logger.error(`Error creating post: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (Contributor and above)
router.put('/:id', protect, authorize('contributor', 'author', 'editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Role-based authorization
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    const isOwner = post.author.toString() === req.user.id;
    
    // Contributors can only edit their own drafts
    if (userRole === 'contributor') {
      if (!isOwner || post.status !== 'draft') {
        return res.status(403).json({
          success: false,
          message: 'Contributors can only edit their own drafts'
        });
      }
      // Contributors cannot publish
      if (req.body.status && req.body.status !== 'draft') {
        req.body.status = 'draft';
      }
    }
    // Authors can edit/publish their own posts
    else if (userRole === 'author') {
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Authors can only edit their own posts'
        });
      }
    }
    // Editors and admins can edit all posts
    else if (!['editor', 'admin', 'super_admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }
    
    // Sanitize HTML content
    if (req.body.content) {
      req.body.content = sanitizeContent(req.body.content);
    }
    
    // Handle version history
    if (req.body.content && req.body.content !== post.content) {
      if (!post.versions) post.versions = [];
      
      post.versions.push({
        content: req.body.content,
        createdAt: Date.now(),
        createdBy: req.user.id
      });
      
      // Keep only the last 10 versions
      if (post.versions.length > 10) {
        post.versions.shift();
      }
      
      req.body.versions = post.versions;
    }
    
    // Set published date if status changes to published
    if (req.body.status === 'published' && post.status !== 'published') {
      req.body.publishedAt = Date.now();
    }

    post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    logger.error(`Error updating post ${req.params.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (Author and above for own posts, Editor+ for all)
router.delete('/:id', protect, authorize('author', 'editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Role-based authorization
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    const isOwner = post.author.toString() === req.user.id || post.author.toString() === req.user._id?.toString();
    
    // Authors can only delete their own posts
    if (userRole === 'author' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Authors can only delete their own posts'
      });
    }
    // Contributors cannot delete posts
    if (userRole === 'contributor') {
      return res.status(403).json({
        success: false,
        message: 'Contributors cannot delete posts'
      });
    }
    // Editors and admins can delete any post
    if (!['editor', 'admin', 'super_admin'].includes(userRole) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`Error deleting post ${req.params.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:id/restore/:versionId
// @desc    Restore post to a previous version
// @access  Private
router.post('/:id/restore/:versionId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Make sure user is post author or admin/editor
    const userRole = req.user.legacyRole || req.user.role;
    if (
      post.author.toString() !== req.user.id &&
      userRole !== 'admin' &&
      userRole !== 'super_admin' &&
      userRole !== 'editor'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to restore this post'
      });
    }
    
    // Find the version
    const version = post.versions.id(req.params.versionId);
    
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }
    
    // Save current content as a new version
    post.versions.push({
      content: post.content,
      createdAt: Date.now(),
      createdBy: req.user.id
    });
    
    // Keep only the last 10 versions
    if (post.versions.length > 10) {
      post.versions.shift();
    }
    
    // Restore content from version
    post.content = version.content;
    post.updatedAt = Date.now();
    
    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    logger.error(`Error restoring post version ${req.params.id}/${req.params.versionId}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:id/translate
// @desc    Create a translation of a post
// @access  Private
router.post('/:id/translate', protect, async (req, res) => {
  try {
    const { language } = req.body;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required'
      });
    }
    
    const sourcePost = await Post.findById(req.params.id);

    if (!sourcePost) {
      return res.status(404).json({
        success: false,
        message: 'Source post not found'
      });
    }
    
    // Create new post as translation
    const translatedPost = new Post({
      title: sourcePost.title,
      content: sourcePost.content,
      author: req.user.id,
      status: 'draft',
      language,
      featuredImage: sourcePost.featuredImage,
      galleryImages: sourcePost.galleryImages,
      categories: sourcePost.categories
    });
    
    // Generate a unique slug for the translation
    translatedPost.slug = `${sourcePost.slug}-${language}`;
    
    await translatedPost.save();
    
    // Add translation reference to source post
    sourcePost.translations.push({
      language,
      postId: translatedPost._id
    });
    
    await sourcePost.save();

    res.status(201).json({
      success: true,
      data: translatedPost
    });
  } catch (err) {
    logger.error(`Error creating translation for post ${req.params.id}: ${err.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;