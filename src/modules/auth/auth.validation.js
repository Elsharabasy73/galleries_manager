const slugify = require("slugify");
const { check } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validation.middleware");
const { ROLES } = require("../../shared/constants/roles");

exports.signupValidator = [
  check("firstName")
    .notEmpty()
    .withMessage("The first name is required")
    .isLength({ min: 3 })
    .withMessage("Too short first name")
    .isLength({ max: 60 })
    .withMessage("Too long first name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val, {
        lower: true,
        strict: true,
      });

      return true;
    }),

  check("lastName")
    .notEmpty()
    .withMessage("The last name is required")
    .isLength({ min: 3 })
    .withMessage("Too short last name")
    .isLength({ max: 60 })
    .withMessage("Too long last name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val, {
        lower: true,
        strict: true,
      });

      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("The email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
  check("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn([ROLES.ADMIN, ROLES.GALLERY_OWNER, ROLES.CRAFTSMAN, ROLES.USER])
    .withMessage("Invalid role. Allowed roles: gallery_owner, craftsman, user"),

  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("The email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  check("password").notEmpty().withMessage("Password is required"),

  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("The email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  validatorMiddleware,
];

exports.verifyResetPasswordOTPValidator = [
  check("email")
    .notEmpty()
    .withMessage("The email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  check("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
    .isNumeric()
    .withMessage("OTP must contain only numbers"),

  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("The email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .custom((val, { req }) => {
      if (val !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),

  validatorMiddleware,
];
