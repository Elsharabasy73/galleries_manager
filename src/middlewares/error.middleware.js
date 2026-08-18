const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const status = error.status || "error";
  const isProduction = process.env.NODE_ENV === "production";

  if (res.headersSent) {
    return next(error);
  }

  const prismaErrorNames = [
    "PrismaClientValidationError",
    "PrismaClientKnownRequestError",
    "PrismaClientUnknownRequestError",
    "PrismaClientRustPanicError",
  ];

  let message = error.message || "Internal server error";

  if (prismaErrorNames.includes(error.name)) {
    message = "Invalid request data.";
  } else if (isProduction && !error.isOperational) {
    message = "Internal server error";
  }

  const response = {
    status,
    message,
  };

  if (error.details) {
    response.errors = error.details;
  }

  if (error.code) {
    response.code = error.code;
  }

  if (!isProduction && !prismaErrorNames.includes(error.name)) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

module.exports = errorHandler;
