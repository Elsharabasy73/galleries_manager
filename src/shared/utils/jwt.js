const jwt = require("jsonwebtoken");

const { getEnvironment } = require("../../config/env");

const generateAuthToken = ({ userId, role }) => {
  const { jwtSecret, jwtExpiresIn } = getEnvironment();

  return jwt.sign({ userId, role }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};

const signToken = (subject, role, options = {}) => {
  const { jwtExpiresIn, jwtSecret } = getEnvironment();

  return jwt.sign({ role }, jwtSecret, {
    subject,
    expiresIn: jwtExpiresIn,
    ...options,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getEnvironment().jwtSecret);
};

module.exports = { generateAuthToken, signToken, verifyToken };
