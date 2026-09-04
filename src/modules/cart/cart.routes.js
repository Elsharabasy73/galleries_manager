const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const { ROLES } = require("../../shared/constants/roles");

const {
  getMyCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart,
} = require("./cart.controller");

const {
  addToCartValidator,
  productIdParamValidator,
  updateCartItemQuantityValidator,
} = require("./cart.validation");

router.use(protect, allowTo([ROLES.USER]));

router
  .route("/")
  .get(getMyCart)
  .post(addToCartValidator, addItemToCart)
  .delete(clearCart);

router
  .route("/:productId")
  .patch(updateCartItemQuantityValidator, updateCartItemQuantity)
  .delete(productIdParamValidator, removeItemFromCart);

module.exports = router;
