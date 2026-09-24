const ApiError = require("../shared/utils/ApiError");

const sendErrorForDev = (err, res) => {
  console.error(err);
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    ...(err.details !== undefined && {
      details: err.details,
      errors: err.details,
    }),
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(err.details !== undefined && {
      details: err.details,
      errors: err.details,
    }),
  });

const handleJsonWebInvalidSignature = () => new ApiError("Invalid token", 401);
const handleJsonExpiredToken = () => new ApiError("Token expired", 401);
const handlePrismaDuplicate = () =>
  new ApiError("A record with this value already exists.", 400);
const handlePrismaValidation = () =>
  new ApiError(
    "Database client is out of date. Regenerate Prisma Client and restart the server.",
    500,
  );

const errorHandler = (err, req, res, _next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") err = handleJsonWebInvalidSignature();
    if (err.name === "ExpiredTokenError") err = handleJsonExpiredToken();
    if (err.code === "P2002") err = handlePrismaDuplicate();
    if (err.name === "PrismaClientValidationError")
      err = handlePrismaValidation();

    sendErrorForProd(err, res);
  }
};

module.exports = errorHandler;
