const { register } = require('./registerController');
const { login } = require('./loginController');
const { logout } = require('./logoutController');
const { getMe } = require('./userController');
const { forgotPassword, resetPassword } = require('./passwordController');
const { verifyOTP, resendVerification } = require('./emailVerificationController');

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyOTP,
  resendVerification
};