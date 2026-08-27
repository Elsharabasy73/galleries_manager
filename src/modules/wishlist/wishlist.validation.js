const { check, param } = require("express-validator");

const { getPrisma } = require("../../config/prisma");
const validatorMiddleware = require("../../middlewares/validation.middleware");

const prisma = getPrisma();

// Product in the body -> required, must exist and be active
const addWishlistItemValidator = [
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
  validatorMiddleware,
];

// Product in the URL -> required, must exist
const productIdParamValidator = [
  param("productId")
    .notEmpty()
    .withMessage("No product ID provided")
    .isUUID()
    .withMessage("Invalid product ID"),
  validatorMiddleware,
];

module.exports = {
  addWishlistItemValidator,
  productIdParamValidator,
};
