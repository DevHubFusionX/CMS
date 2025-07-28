const User = require('../../models/User');
const Role = require('../../models/Role');
const { sendEmail } = require('../../utils/email');

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

    // Email content
    const message = `
      <h2>Welcome to FusionX CMS!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering with FusionX CMS. Please use the following OTP to verify your email address:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; padding: 15px 30px; background-color: #3B82F6; color: white; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 8px;">${otp}</span>
      </div>
      <p>This OTP will expire in 10 minutes.</p>
      <p>If you didn't create this account, please ignore this email.</p>
      <br>
      <p>Best regards,<br>The FusionX CMS Team</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Email - FusionX CMS',
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