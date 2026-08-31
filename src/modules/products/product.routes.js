const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  setGalleryAndCreator,
  checkProductOwnership,
  setGalleryIdFilter,
} = require("./product.controller");

const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
  galleryIdValidator,
} = require("./product.validation");

router.use(galleryIdValidator, setGalleryIdFilter);

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
