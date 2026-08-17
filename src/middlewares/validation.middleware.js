const { validationResult } = require("express-validator");

const ApiError = require("../shared/utils/ApiError");

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new ApiError("Validation failed", 400, errors.array()));
  }

  return next();
};

module.exports = validate;
