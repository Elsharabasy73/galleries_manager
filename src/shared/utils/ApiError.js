class ApiError extends Error {
  constructor(message, statusCode, details) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? "error" : "fail";
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
