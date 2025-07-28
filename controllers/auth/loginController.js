const User = require('../../models/User');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Set timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 25000);
    });

    // Check for user with timeout
    const userPromise = User.findOne({ email }).select('+password');
    const user = await Promise.race([userPromise, timeoutPromise]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    let token;
    try {
      token = user.getSignedJwtToken();
    } catch (tokenError) {
      console.error('JWT token generation error:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Authentication service error'
      });
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        legacyRole: user.legacyRole,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    
    if (err.message === 'Database operation timeout') {
      return res.status(504).json({
        success: false,
        message: 'Database connection timeout. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};