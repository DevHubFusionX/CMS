const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/comments
// @desc    Get all comments
// @access  Private (Editor and above)
router.get('/', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('user', 'name avatar')
      .populate('post', 'title slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/comments/post/:postId
// @desc    Get comments for a post
// @access  Public (only approved comments)
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
      status: 'approved'
    })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/comments
// @desc    Create a comment
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const comment = await Comment.create(req.body);

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Update comment status
// @access  Private (Editor and above)
router.put('/:id', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const comment = await Comment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (Admin/Editor or comment owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner, admin or editor
    const userRole = req.user.legacyRole || req.user.role?.name || req.user.role;
    if (
      comment.user.toString() !== req.user.id &&
      !['editor', 'admin', 'super_admin'].includes(userRole)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.remove();

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