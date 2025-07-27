const User = require('../models/User');
const Role = require('../models/Role');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'subscriber' } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Get selected role or default to subscriber
    const selectedRole = await Role.findOne({ name: role });
    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }
    
    // Create user
    user = await User.create({
      name,
      email,
      password,
      role: selectedRole._id,
      legacyRole: role
    });

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
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

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
    const userPromise = User.findOne({ email }).select('+password').populate('role');
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
    const token = user.getSignedJwtToken();

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

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    console.log('🔄 Password reset request received for:', req.body.email);
    const { email } = req.body;

    if (!email) {
      console.log('❌ No email provided');
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    console.log('🔍 Searching for user with email:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found for email:', email);
      // Return success even if user not found for security reasons
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }
    
    console.log('✅ User found:', user.name, user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    // Create HTML email template
    const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #e9ecef; }
            .logo { width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
            .content { padding: 30px 0; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e9ecef; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">F</div>
                <h1 style="margin: 10px 0 0 0; color: #333;">FusionX CMS</h1>
            </div>
            
            <div class="content">
                <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>You are receiving this email because you (or someone else) has requested a password reset for your FusionX CMS account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">${resetUrl}</p>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul style="margin: 10px 0;">
                        <li>This link will expire in <strong>10 minutes</strong></li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Your password will remain unchanged until you click the link above</li>
                    </ul>
                </div>
                
                <p>If you're having trouble clicking the button, you can also visit the link manually.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent from FusionX CMS</p>
                <p>If you didn't request this password reset, please contact support immediately.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
      console.log('📧 Attempting to send email to:', user.email);
      console.log('📧 Reset URL:', resetUrl);
      
      await sendEmail({
        email: user.email,
        subject: '🔐 Password Reset Request - FusionX CMS',
        message: htmlMessage,
        html: htmlMessage
      });

      console.log('✅ Email sent successfully to:', user.email);
      res.status(200).json({
        success: true,
        message: 'Email sent'
      });
    } catch (err) {
      console.error('❌ Email sending failed:', err.message);
      console.error('❌ Full error:', err);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent: ' + err.message
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user by token and check if token is expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate new token
    const authToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
