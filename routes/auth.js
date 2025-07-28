const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Rate limiting for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { success: false, message: 'Too many authentication attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: { success: false, message: 'Too many password reset attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// @route   POST /api/auth/register
// @desc    Register user (Author and Subscriber only)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, authController.login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   POST /api/auth/logout
// @desc    Logout user and blacklist token
// @access  Private
router.post('/logout', protect, authController.logout);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password - send reset email
// @access  Public
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// @route   POST /api/auth/verify-otp
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-otp', authController.verifyOTP);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authController.resendVerification);

module.exports = router;