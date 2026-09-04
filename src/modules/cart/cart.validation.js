const { check, param } = require("express-validator");

const { getPrisma } = require("../../config/prisma");
const validatorMiddleware = require("../../middlewares/validation.middleware");

const prisma = getPrisma();

// Product in the body -> required, must exist and be active
const addToCartValidator = [
  check("productId")
    .notEmpty()
    .withMessage("The product is required")
    .isUUID()
    .withMessage("Invalid product ID")
    .custom(async (value) => {
      const product = await prisma.product.findUnique({
        where: { id: value },
      });

      if (!product || product.status !== "active") {
        throw new Error("Invalid product ID");
      }

      return true;
    }),
  check("quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer of at least 1")
    .toInt(),
  validatorMiddleware,
];

// Product in the URL -> required
const productIdParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("No product ID provided")
    .isUUID()
    .withMessage("Invalid product ID"),
  validatorMiddleware,
];

// New quantity -> required
const updateCartItemQuantityValidator = [
  ...productIdParamValidator,
  check("quantity")
    .notEmpty()
    .withMessage("The quantity is required")
    .isInt({ min: 1 })
    .withMessage("Quantity must be an integer of at least 1")
    .toInt(),
  validatorMiddleware,
];

module.exports = {
  addToCartValidator,
  productIdParamValidator,
  updateCartItemQuantityValidator,
};
