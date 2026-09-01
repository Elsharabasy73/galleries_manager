const { check, param } = require("express-validator");
const slugify = require("slugify");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

const validatorMiddleware = require("../../middlewares/validation.middleware");

// Field factories: rules only, fresh chain per call — endpoints decide optionality
const nameField = () =>
  check("name")
    .notEmpty()
    .withMessage("The name is required")
    .isLength({ min: 3 })
    .withMessage("Too short name")
    .isLength({ max: 60 })
    .withMessage("Too long name")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value, {
        lower: true,
        strict: true,
      });

      // Unique per gallery (schema: @@unique([galleryId, slug]))
      if (req.body.galleryId) {
        const existing = await prisma.product.findUnique({
          where: {
            galleryId_slug: {
              galleryId: req.body.galleryId,
              slug: req.body.slug,
            },
          },
        });

        // On update, ignore the product being updated itself
        if (existing && existing.id !== req.params.id) {
          throw new Error(
            "A product with this name already exists in this gallery",
          );
        }
      }

      return true;
    });

const priceField = () =>
  check("price")
    .notEmpty()
    .withMessage("The price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number");

const categoryField = () =>
  check("categoryId")
    .notEmpty()
    .withMessage("The category is required")
    .isUUID()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await prisma.category.findUnique({
        where: { id: value },
      });

      if (!category) {
        throw new Error("Invalid category ID");
      }

      return true;
    });

const descriptionField = () =>
  check("description")
    .isLength({ max: 1000 })
    .withMessage("Too long description");

const compareAtPriceField = () =>
  check("compareAtPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("compareAtPrice must be a positive number");

const stockField = () =>
  check("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer");

const statusField = () =>
  check("status")
    .optional()
    .isIn(["draft", "active", "archived"])
    .withMessage("Status must be draft, active, or archived");

const materialsField = () =>
  check("materials")
    .optional()
    .isArray()
    .withMessage("Materials must be an array of strings");

const dimensionsField = () =>
  check("dimensions")
    .optional()
    .isString()
    .withMessage("Dimensions must be a string");

const isFeaturedField = () =>
  check("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean");

const productFields = [
  nameField,
  priceField,
  categoryField,
  descriptionField,
  compareAtPriceField,
  stockField,
  statusField,
  materialsField,
  dimensionsField,
  isFeaturedField,
];

// ID in the URL -> load the product, attach it to req.product (unchanged)
const productIdValidator = param("id")
  .notEmpty()
  .withMessage("No id provided")
  .isUUID()
  .withMessage("Invalid product ID")
  .custom(async (value, { req }) => {
    const product = await prisma.product.findUnique({
      where: { id: value },
    });

    if (!product) {
      throw new Error("Invalid product ID");
    }

    req.product = product;
    return true;
  });

const galleryIdValidator = [
  param("galleryId")
    .optional() // absent on standalone /products routes
    .isUUID()
    .withMessage("Invalid gallery ID"),
  validatorMiddleware,
];

const applyProductDefaults = (req, res, next) => {
  if (req.method === "POST") {
    if (req.body.stock == null) {
      req.body.stock = 1;
    }
  }

  if (req.body.compareAtPrice == null && req.body.price != null) {
    req.body.compareAtPrice = req.body.price;
  }
  next();
};

// Create
const createProductValidator = [
  ...productFields.map((field) => field()),
  validatorMiddleware,
  applyProductDefaults,
];

const getProductValidator = [productIdValidator, validatorMiddleware];

// Update (PATCH): same rules, nothing required
const updateProductValidator = [
  productIdValidator,
  ...productFields.map((field) => field().optional()),
  validatorMiddleware,
  applyProductDefaults,
];

const deleteProductValidator = [productIdValidator, validatorMiddleware];

module.exports = {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
  galleryIdValidator,
};