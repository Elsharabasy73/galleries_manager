const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { uploadMixOfImages } = require("../../middlewares/uploadImage.middleware");

const uploadProductImages = uploadMixOfImages([
  { name: "mainImage", maxCount: 1 },
  { name: "mainImageUrl", maxCount: 1 },
  { name: "images", maxCount: 8 },
  { name: "image", maxCount: 1 },
]);

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
    uploadProductImages,
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
    uploadProductImages,
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
