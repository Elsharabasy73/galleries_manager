const { check, param } = require("express-validator");
const slugify = require("slugify");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

const validatorMiddleware = require("../../middlewares/validation.middleware");

// Reusable fields
const nameValidator = check("name")
  .notEmpty()
  .withMessage("The name is required")
  .isLength({ min: 3 })
  .withMessage("Too short name")
  .isLength({ max: 60 })
  .withMessage("Too long name")
  .custom((value, { req }) => {
    req.body.slug = slugify(value, {
      lower: true,
      strict: true,
    });

    return true;
  });

const arabicNameValidator = check("arabicName")
  .notEmpty()
  .withMessage("The arabic name is required")
  .isLength({ min: 3 })
  .withMessage("Too short arabic name")
  .isLength({ max: 60 })
  .withMessage("Too long arabic name");

// Reusable category fields
const categoryFieldsValidators = [
  nameValidator,
  arabicNameValidator,
];

// Reusable ID validator
const categoryIdValidator = param("id")
  .notEmpty()
  .withMessage("No id provided")
  .isUUID()
  .withMessage("Invalid category ID")
  .custom(async (value, { req }) => {
    const category = await prisma.category.findUnique({
      where: {
        id: value,
      },
    });
    if (!category) {
      throw new Error("Invalid category ID");
    }
    req.category = category;
    return true;
  });

// Create
const createCategoryValidator = [
  ...categoryFieldsValidators,
  validatorMiddleware,
];

// Get one
const getCategoryValidator = [
  categoryIdValidator,
  validatorMiddleware,
];

// Update
const updateCategoryValidator = [
  categoryIdValidator,
  ...categoryFieldsValidators,
  validatorMiddleware,
];

// Delete
const deleteCategoryValidator = [
  categoryIdValidator,
  validatorMiddleware,
];

module.exports = {
  createCategoryValidator,
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
};