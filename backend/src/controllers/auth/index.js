/**
 * Auth Controller - Main Entry Point
 * Export tất cả auth controller functions
 */

const { register } = require('./register.controller');
const { login } = require('./login.controller');
const { getMessage } = require('./message.controller');

module.exports = {
  register,
  login,
  getMessage
};
