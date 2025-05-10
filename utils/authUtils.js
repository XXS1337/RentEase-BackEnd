const jwt = require('jsonwebtoken');

function createToken(user) {
  return jwt.sign({ id: user._id }, process.env.SECRET_STR, { expiresIn: process.env.LOGIN_EXPIRES });
}

module.exports = { createToken };
