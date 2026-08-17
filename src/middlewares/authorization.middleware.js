const ApiError = require("../shared/utils/ApiError");

const authorize = (allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new TypeError("authorize requires a non-empty array of roles");
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError("You are not authorized for this action", 403));
    }

    return next();
  };
};

module.exports = authorize;
