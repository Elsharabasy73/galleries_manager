const ApiError = require("../shared/utils/ApiError");

const upload = () => {
  return (req, res, next) => {
    return next(new ApiError("File uploads are not configured yet", 501));
  };
};

module.exports = upload;
