const { check, param } = require("express-validator");
const { getPrisma } = require("../../config/prisma");
const validate = require("../../middlewares/validation.middleware");

const prisma = getPrisma();

const updateMeValidator = [
  check("firstName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short first name")
    .isLength({ max: 60 })
    .withMessage("Too long first name"),

  check("lastName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short last name")
    .isLength({ max: 60 })
    .withMessage("Too long last name"),

  check("phone")
    .optional()
    .isLength({ min: 5 })
    .withMessage("Too short phone")
    .isLength({ max: 20 })
    .withMessage("Too long phone"),

  check("avatar").optional().isString().withMessage("Avatar must be a string"),

  // Reject protected fields if sent
  check("role").not().exists().withMessage("You cannot update role"),
  check("email")
    .not()
    .exists()
    .withMessage("Use email update endpoint if available"),
  check("password")
    .not()
    .exists()
    .withMessage("Use /me/password to update password"),
  check("isActive").not().exists().withMessage("You cannot update isActive"),

  validate,
];

const deleteUserValidator = [
  param("id")
    .notEmpty()
    .withMessage("No id provided")
    .isUUID()
    .withMessage("Invalid user ID")
    .bail()
    .custom(async (value) => {
      const user = await prisma.user.findUnique({ where: { id: value } });
      if (!user) {
        throw new Error("User not found");
      }
      return true;
    }),
  validate,
];

const updatePasswordValidator = [
  check("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  check("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  validate,
];

module.exports = {
  updateMeValidator,
  deleteUserValidator,
  updatePasswordValidator,
};
