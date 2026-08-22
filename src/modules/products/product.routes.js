const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  setGalleryAndCreator,
  checkProductOwnership,
} = require("./product.controller");

const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
} = require("./product.validation");

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    allowTo(["gallery_owner", "employee"]),
    setGalleryAndCreator,
    createProductValidator,
    createProduct,
  );

router
  .route("/:id")
  .get(getProductValidator, getProduct)
  .put(
    protect,
    allowTo(["gallery_owner", "employee"]),
    updateProductValidator,
    checkProductOwnership,
    updateProduct,
  )
  .delete(
    protect,
    allowTo(["gallery_owner", "employee"]),
    deleteProductValidator,
    checkProductOwnership,
    deleteProduct,
  );

module.exports = router;