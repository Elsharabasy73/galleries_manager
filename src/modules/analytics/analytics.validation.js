const { body, query } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validation.middleware");

const trackValidator = [
  body("visitorId").isUUID().withMessage("visitorId must be a UUID"),
  body("sessionId")
    .isString()
    .withMessage("sessionId is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Invalid sessionId"),
  body("path")
    .isString()
    .withMessage("path is required")
    .isLength({ min: 1, max: 500 })
    .withMessage("Invalid path"),
  body("referrer")
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Invalid referrer"),
  body("userId").optional().isUUID().withMessage("userId must be a UUID"),
  validatorMiddleware,
];

const visitorsValidator = [
  query("from").optional().isISO8601().withMessage("from must be an ISO date"),
  query("to").optional().isISO8601().withMessage("to must be an ISO date"),
  query("groupBy")
    .optional()
    .isIn(["day", "week", "month"])
    .withMessage("groupBy must be day, week or month"),
  validatorMiddleware,
];

module.exports = {
  trackValidator,
  visitorsValidator,
};
