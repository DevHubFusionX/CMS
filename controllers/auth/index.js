const { register } = require('./registerController');
const { login } = require('./loginController');
const { getMe } = require('./userController');
const { forgotPassword, resetPassword } = require('./passwordController');

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword
};