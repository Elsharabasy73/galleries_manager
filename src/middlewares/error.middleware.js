const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || 500;
  let status = error.status || "error";

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

  if (error.code === "P2002") {
    statusCode = 400;
    status = "fail";
    message = "A record with this value already exists.";
  } else if (error.code === "P2003") {
    statusCode = 400;
    status = "fail";
    message = "A referenced record does not exist.";
  } else if (error.code === "P2025") {
    statusCode = 404;
    status = "fail";
    message = "Record not found.";
  } else if (error.name === "PrismaClientValidationError") {
    statusCode = 400;
    status = "fail";

    // KEEP THE REAL PRISMA ERROR
    message = error.message;
  } else if (prismaErrorNames.includes(error.name)) {
    statusCode = 400;
    status = "fail";
    message = error.message;
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
