const validatorMiddleware = require("../../middlewares/validation.middleware");

// No body/param validation required for image stats endpoints.
// Exported array keeps the Validation → Auth → Controller chain consistent
// and allows future query validators to be added without changing routes.
const getImageStatsValidator = [validatorMiddleware];
const getImageOrphansValidator = [validatorMiddleware];

module.exports = {
  getImageStatsValidator,
  getImageOrphansValidator,
};
