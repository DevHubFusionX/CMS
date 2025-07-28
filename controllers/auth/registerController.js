const User = require('../../models/User');
const Role = require('../../models/Role');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate allowed roles
    const allowedRoles = ['author', 'subscriber'];
    const selectedRole = role || 'subscriber';
    
    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Only Author and Subscriber roles are allowed for registration'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Get role ObjectId
    const roleDoc = await Role.findOne({ name: selectedRole });
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: roleDoc._id,
      legacyRole: selectedRole
    });

    // Populate role for response
    await user.populate('role');

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
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
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};