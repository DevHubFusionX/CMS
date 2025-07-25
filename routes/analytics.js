const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/analytics
// @desc    Get analytics data
// @access  Private (Editor and above)
router.get('/', protect, authorize('editor', 'admin', 'super_admin'), async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const days = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get posts stats
    const totalPosts = await Post.countDocuments();
    const publishedPosts = await Post.countDocuments({ status: 'published' });
    const draftPosts = await Post.countDocuments({ status: 'draft' });
    const scheduledPosts = await Post.countDocuments({ status: 'scheduled' });

    // Get users count
    const totalUsers = await User.countDocuments();

    // Get comments count
    const totalComments = await Comment.countDocuments();

    // Posts by date (last 30 days)
    const postsByDate = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Posts by category
    const postsByCategory = await Post.aggregate([
      { $unwind: { path: "$categories", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      {
        $group: {
          _id: {
            $ifNull: [{ $arrayElemAt: ["$categoryInfo.name", 0] }, "Uncategorized"]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Posts by author
    const postsByUser = await Post.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorInfo"
        }
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$authorInfo.name", 0] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Recent activity
    const recentActivity = await Post.find()
      .populate('author', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title author status createdAt updatedAt');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPosts,
          publishedPosts,
          draftPosts,
          scheduledPosts,
          totalUsers,
          totalComments
        },
        postsByDate: postsByDate.map(item => ({
          date: item._id,
          count: item.count
        })),
        postsByCategory: postsByCategory.map(item => ({
          category: item._id,
          count: item.count
        })),
        postsByUser: postsByUser.map(item => ({
          user: item._id || 'Unknown',
          count: item.count
        })),
        recentActivity: recentActivity.map(post => ({
          id: post._id,
          title: post.title,
          author: post.author?.name || 'Unknown',
          status: post.status,
          date: post.updatedAt || post.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;