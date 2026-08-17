const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const isProduction = process.env.NODE_ENV === "production";

  if (res.headersSent) {
    return next(error);
  }

  const response = {
    status,
    message:
      isProduction && !error.isOperational
        ? "Internal server error"
        : error.message || "Internal server error",
  };

  if (error.details) {
    response.errors = error.details;
  }

  if (!isProduction) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
