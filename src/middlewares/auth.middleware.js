const ApiError = require("../shared/utils/ApiError");
const { verifyToken } = require("../shared/utils/jwt");

const authenticate = (req, res, next) => {
  const authorization = req.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return next(new ApiError("Authentication required", 401));
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return next(new ApiError("Authentication required", 401));
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded.sub || !decoded.role) {
      return next(new ApiError("Invalid authentication token", 401));
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    return next();
  } catch {
    return next(new ApiError("Invalid authentication token", 401));
  }
};

module.exports = authenticate;
