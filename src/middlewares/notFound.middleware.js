const ApiError = require("../shared/utils/ApiError");

const notFound = (req, res, next) => {
  return next(
    new ApiError(`Route not found: ${req.method} ${req.originalUrl}`, 404),
  );
};

module.exports = notFound;
