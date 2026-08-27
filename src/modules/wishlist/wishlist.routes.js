const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const { ROLES } = require("../../shared/constants/roles");

const {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("./wishlist.controller");

const {
  addWishlistItemValidator,
  productIdParamValidator,
} = require("./wishlist.validation");

router.use(protect, allowTo([ROLES.USER]));

router
  .route("/")
  .get(getMyWishlist)
  .post(addWishlistItemValidator, addToWishlist);

router
  .route("/:productId")
  .delete(productIdParamValidator, removeFromWishlist);

module.exports = router;
