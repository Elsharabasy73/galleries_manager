const { check, param } = require("express-validator");
const slugify = require("slugify");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

const validatorMiddleware = require("../../middlewares/validation.middleware");

// Name -> required, length, slugify + unique-per-gallery check
const nameValidator = check("name")
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

const priceValidator = check("price")
  .notEmpty()
  .withMessage("The price is required")
  .isFloat({ min: 0 })
  .withMessage("Price must be a positive number");

const categoryIdValidator = check("categoryId")
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

// Optional fields (create can pass them, update can change them)
const descriptionValidator = check("description")
  .optional()
  .isLength({ max: 1000 })
  .withMessage("Too long description");

const compareAtPriceValidator = check("compareAtPrice")
  .optional()
  .isFloat({ min: 0 })
  .withMessage("compareAtPrice must be a positive number");

const stockValidator = check("stock")
  .optional()
  .isInt({ min: 0 })
  .withMessage("Stock must be a non-negative integer");

const statusValidator = check("status")
  .optional()
  .isIn(["draft", "active", "archived"])
  .withMessage("Status must be draft, active, or archived");

const materialsValidator = check("materials")
  .optional()
  .isArray()
  .withMessage("Materials must be an array of strings");

const dimensionsValidator = check("dimensions")
  .optional()
  .isString()
  .withMessage("Dimensions must be a string");

const isFeaturedValidator = check("isFeatured")
  .optional()
  .isBoolean()
  .withMessage("isFeatured must be a boolean");

// ID in the URL -> load the product, attach it to req.product
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

const createProductValidator = [
  nameValidator,
  priceValidator,
  categoryIdValidator,
  descriptionValidator,
  compareAtPriceValidator,
  stockValidator,
  statusValidator,
  materialsValidator,
  dimensionsValidator,
  isFeaturedValidator,
  validatorMiddleware,
];

const getProductValidator = [productIdValidator, validatorMiddleware];

const updateProductValidator = [
  productIdValidator,
  nameValidator,
  priceValidator,
  categoryIdValidator,
  descriptionValidator,
  compareAtPriceValidator,
  stockValidator,
  statusValidator,
  materialsValidator,
  dimensionsValidator,
  isFeaturedValidator,
  validatorMiddleware,
];

const deleteProductValidator = [productIdValidator, validatorMiddleware];

module.exports = {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
};