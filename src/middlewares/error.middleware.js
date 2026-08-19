const ApiError = require("../shared/utils/ApiError");

const sendErrorForDev = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });

const sendErrorForProd = (err, res) =>
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });

const handleJsonWebInvalidSignature = () => new ApiError("Invalid token", 401);
const handleJsonExpiredToken = () => new ApiError("Token expired", 401);

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  // console.error(err);

  if (process.env.NODE_ENV === "development") {
    sendErrorForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") err = handleJsonWebInvalidSignature();
    if (err.name === "ExpiredTokenError") err = handleJsonExpiredToken();

    sendErrorForProd(err, res);
  }
};

module.exports = errorHandler;
