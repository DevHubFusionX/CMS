const User = require('../../models/User')
const { renderEmailVerificationOTP } = require('../../utils/emailTemplates')

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({
      email,
      emailVerificationOTP: otp,
      emailVerificationExpire: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }

    // Verify user
    user.isEmailVerified = true
    user.emailVerificationOTP = undefined
    user.emailVerificationExpire = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    })
  } catch (err) {
    console.error('OTP verification error:', err)
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    })
  }
}

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      })
    }

    // Generate new OTP
    const otp = user.generateEmailOTP()
    await user.save()

    // Email content using template
    const message = renderEmailVerificationOTP(user.name, otp)

    const { sendEmail } = require('../../utils/email')
    await sendEmail({
      to: user.email,
      subject: 'Your HubFusionx CMS Verification Code',
      html: message
    })

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully!'
    })
  } catch (err) {
    console.error('Resend verification error:', err)
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    })
  }
}
