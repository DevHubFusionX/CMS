const User = require('../../models/User');

// @desc    Logout user and blacklist token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Add current token to blacklist
    user.tokenBlacklist.push({
      token: req.token,
      blacklistedAt: new Date()
    });
    
    // Keep only last 10 blacklisted tokens to prevent bloat
    if (user.tokenBlacklist.length > 10) {
      user.tokenBlacklist = user.tokenBlacklist.slice(-10);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};