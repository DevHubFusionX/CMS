const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const User = require('../../models/User');
const { sendEmail } = require('../../utils/email');

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

    // Load and customize HTML email template
    const templatePath = path.join(__dirname, '../../templates/passwordResetEmail.html');
    let htmlMessage = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with actual values
    htmlMessage = htmlMessage
      .replace(/{{userName}}/g, user.name)
      .replace(/{{resetUrl}}/g, resetUrl)
      .replace(/{{currentYear}}/g, new Date().getFullYear());

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