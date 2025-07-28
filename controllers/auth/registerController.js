const User = require('../../models/User');
const Role = require('../../models/Role');
const { sendEmail } = require('../../utils/email');
const { renderEmailVerificationOTP } = require('../../utils/emailTemplates');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate password strength
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter, lowercase letter, number, and special character'
      });
    }

    // Validate allowed roles
    const allowedRoles = ['author', 'subscriber'];
    const selectedRole = role || 'subscriber';
    
    if (!allowedRoles.includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Only Author and Subscriber roles are allowed for registration'
      });
    }

    // Check if user exists (including any potential stale data)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If user exists but is not email verified, allow re-registration
      if (!existingUser.isEmailVerified) {
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email address'
        });
      }
    }

    // Get role ObjectId
    const roleDoc = await Role.findOne({ name: selectedRole });
    if (!roleDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create user (not verified yet)
    const user = await User.create({
      name,
      email,
      password,
      role: roleDoc._id,
      legacyRole: selectedRole,
      isEmailVerified: false
    });

    // Generate email verification OTP
    const otp = user.generateEmailOTP();
    await user.save();

    // Email content using template
    const message = renderEmailVerificationOTP(name, otp);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Complete Your FusionX CMS Registration',
        html: message
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for the verification OTP.',
        email: user.email
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Delete user if email fails
      await User.findByIdAndDelete(user._id);
      
      res.status(500).json({
        success: false,
        message: 'Registration failed. Could not send verification email.'
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};