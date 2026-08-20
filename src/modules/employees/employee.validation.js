const { check, param } = require("express-validator");
const slugify = require("slugify");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

const validatorMiddleware = require("../../middlewares/validation.middleware");
const { ROLES } = require("../../shared/constants/roles");

// Reusable fields
const firstNameValidator = check("firstName")
  .notEmpty()
  .withMessage("The first name is required")
  .isLength({ min: 3 })
  .withMessage("Too short first name")
  .isLength({ max: 60 })
  .withMessage("Too long first name");

const lastNameValidator = check("lastName")
  .notEmpty()
  .withMessage("The last name is required")
  .isLength({ min: 3 })
  .withMessage("Too short last name")
  .isLength({ max: 60 })
  .withMessage("Too long last name")
  .custom((value, { req }) => {
    req.body.slug = slugify(req.body.firstName + " " + req.body.lastName, {
      lower: true,
      strict: true,
    });

    return true;
  });

const emailValidator = check("email")
  .notEmpty()
  .withMessage("The email is required")
  .isEmail()
  .withMessage("Invalid email address")
  .normalizeEmail()
  .custom(async (value) => {
    const user = await prisma.user.findUnique({
      where: {
        email: value,
      },
    });

    if (user) {
      throw new Error("Email already in use");
    }

    return true;
  });

const passwordValidator = check("password")
  .notEmpty()
  .withMessage("Password is required")
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");

const passwordConfirmValidator = check("passwordConfirm")
  .notEmpty()
  .withMessage("Password confirmation is required")
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }

    return true;
  });

const phoneValidator = check("phone")
  .optional()
  .isLength({ min: 5 })
  .withMessage("Too short phone")
  .isLength({ max: 20 })
  .withMessage("Too long phone");

const titleValidator = check("title")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Too short title")
  .isLength({ max: 100 })
  .withMessage("Too long title");

const galleryExistsCheck = async (value, { req }) => {
  const gallery = await prisma.gallery.findUnique({
    where: {
      id: value,
    },
  });

  if (!gallery) {
    throw new Error("Invalid gallery ID");
  }

  if (req.user.role === ROLES.ADMIN) {
    return true;
  }

  if (req.user.role === ROLES.GALLERY_OWNER) {
    if (gallery.ownerId !== req.user.id) {
      throw new Error("You can only manage your own gallery");
    }

    return true;
  }

  if (req.user.role === ROLES.EMPLOYEE) {
    const employee = await prisma.employee.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!employee || employee.galleryId !== gallery.id) {
      throw new Error("You can only manage employees of your own gallery");
    }
  }

  return true;
};

const galleryIdParamValidator = param("galleryId")
  .optional()
  .isUUID()
  .withMessage("Invalid gallery ID")
  .custom(galleryExistsCheck);

// Reusable employee fields
const employeeFieldsValidators = [
  firstNameValidator,
  lastNameValidator,
  emailValidator,
  passwordValidator,
  passwordConfirmValidator,
  phoneValidator,
  titleValidator,
  galleryIdParamValidator,
];

// Reusable update fields
const updateEmployeeFieldsValidators = [
  check("firstName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short first name")
    .isLength({ max: 60 })
    .withMessage("Too long first name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value, {
        lower: true,
        strict: true,
      });

      return true;
    }),

  check("lastName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short last name")
    .isLength({ max: 60 })
    .withMessage("Too long last name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value, {
        lower: true,
        strict: true,
      });

      return true;
    }),

  check("email")
    .optional()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail()
    .custom(async (value, { req }) => {
      const user = await prisma.user.findUnique({
        where: {
          email: value,
        },
      });

      if (user && user.id !== req.employee.userId) {
        throw new Error("Email already in use");
      }

      return true;
    }),

  phoneValidator,

  titleValidator,

  check("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),

  check("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  check("passwordConfirm")
    .optional()
    .custom((value, { req }) => {
      if (req.body.password && value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),
];

// Reusable ID validator
const employeeIdValidator = param("id")
  .notEmpty()
  .withMessage("No id provided")
  .isUUID()
  .withMessage("Invalid employee ID")
  .custom(async (value, { req }) => {
    const employee = await prisma.employee.findUnique({
      where: {
        id: value,
      },
    });

    if (!employee) {
      throw new Error("Invalid employee ID");
    }

    req.employee = employee;

    if (req.params.galleryId && req.employee.galleryId !== req.params.galleryId) {
      throw new Error("Employee does not belong to this gallery");
    }

    return true;
  });

// Create
const createEmployeeValidator = [
  ...employeeFieldsValidators,
  validatorMiddleware,
];

// Get one
const getEmployeeValidator = [
  galleryIdParamValidator,
  employeeIdValidator,
  validatorMiddleware,
];

// Update
const updateEmployeeValidator = [
  galleryIdParamValidator,
  employeeIdValidator,
  ...updateEmployeeFieldsValidators,
  validatorMiddleware,
];

// Delete
const deleteEmployeeValidator = [
  galleryIdParamValidator,
  employeeIdValidator,
  validatorMiddleware,
];

module.exports = {
  createEmployeeValidator,
  getEmployeeValidator,
  updateEmployeeValidator,
  deleteEmployeeValidator,
};
