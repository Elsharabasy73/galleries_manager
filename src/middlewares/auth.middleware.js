const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const ApiError = require("../shared/utils/ApiError");
const { getPrisma } = require("../config/prisma");

const prisma = getPrisma();

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  // 1. Check if Bearer token was provided
  let token;

  const authorization = req.headers.authorization;

  if (authorization && authorization.startsWith("Bearer ")) {
    token = authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ApiError("No token provided", 401));
  }

  // 2. Verify token
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError("Token expired", 401));
    }

    return next(new ApiError("Invalid token", 401));
  }
  // 3. Find user
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    return next(new ApiError("User not found", 401));
  }

  // 4. Check if account is active
  if (!user.isActive) {
    return next(new ApiError("Your account has been deactivated", 401));
  }

  // 5. Check if password was changed after token was issued
  if (
    user.passwordChangedAt &&
    user.passwordChangedAt.getTime() / 1000 > decoded.iat
  ) {
    return next(
      new ApiError("Token expired because password was changed", 401),
    );
  }

  // 6. Attach user to request
  req.user = user;

  next();
});

exports.allowTo = (roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("You are not authorized to do this", 403));
    }
    next();
  });
