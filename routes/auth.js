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
router.post('/login', authLimiter, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-verification', authController.resendVerification);

module.exports = router;