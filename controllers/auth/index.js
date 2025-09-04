const registerController = require('./registerController');
const loginController = require('./loginController');
const logoutController = require('./logoutController');
const userController = require('./userController');
const passwordController = require('./passwordController');
const emailVerificationController = require('./emailVerificationController');

module.exports = {
  register: registerController.register,
  login: loginController.login,
  logout: logoutController.logout,
  getMe: userController.getMe,
  forgotPassword: passwordController.forgotPassword,
  resetPassword: passwordController.resetPassword,
  verifyOTP: emailVerificationController.verifyOTP,
  resendVerification: emailVerificationController.resendVerification
};