const { body, param } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validation.middleware");

const TYPES = ["problem", "feature", "question", "other"];
const STATUSES = ["new", "in_progress", "resolved", "closed"];

// POST /api/v1/support — public
const createTicketValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be 2–80 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .isLength({ max: 255 })
    .withMessage("Email is too long")
    .normalizeEmail(),
  body("type")
    .optional()
    .isIn(TYPES)
    .withMessage(`Type must be one of: ${TYPES.join(", ")}`),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Subject must be 5–150 characters"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10–2000 characters"),
  body("userId").optional().isUUID().withMessage("Invalid user ID"),
  body("pageUrl")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Page URL is too long"),
  body("userAgent")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("User agent is too long"),
  validatorMiddleware,
];

// PUT /api/v1/support/:id — admin (status only)
const updateTicketValidator = [
  param("id").isUUID().withMessage("Invalid ticket ID"),
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
  validatorMiddleware,
];

const ticketIdValidator = [
  param("id").isUUID().withMessage("Invalid ticket ID"),
  validatorMiddleware,
];

module.exports = {
  TYPES,
  STATUSES,
  createTicketValidator,
  updateTicketValidator,
  ticketIdValidator,
};
