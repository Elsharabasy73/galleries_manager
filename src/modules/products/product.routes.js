const express = require("express");

const router = express.Router({ mergeParams: true });

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const {
  uploadMixOfImages,
} = require("../../middlewares/uploadImage.middleware");
const { ROLES } = require("../../shared/constants/roles");
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
  countProducts,
} = require("./product.controller");

const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator,
  galleryIdValidator,
} = require("./product.validation");

// count must be before /:id otherwise "count" is treated as :id
router.get("/count", protect, allowTo([ROLES.ADMIN]), countProducts);

router.use(galleryIdValidator, setGalleryIdFilter);

router
  .route("/")
  .get(getAllProducts)
  .post(
    protect,
    allowTo([ROLES.ADMIN, ROLES.GALLERY_OWNER, ROLES.EMPLOYEE]),
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
    allowTo([ROLES.ADMIN, ROLES.GALLERY_OWNER, ROLES.EMPLOYEE]),
    uploadProductImages,
    updateProductValidator,
    checkProductOwnership,
    updateProduct,
  )
  .delete(
    protect,
    allowTo([ROLES.ADMIN, ROLES.GALLERY_OWNER, ROLES.EMPLOYEE]),
    deleteProductValidator,
    checkProductOwnership,
    deleteProduct,
  );

module.exports = router;
