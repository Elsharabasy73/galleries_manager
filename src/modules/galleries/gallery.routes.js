const express = require("express");

const router = express.Router();
const {
  uploadgalleryImages,
  resizeGalleryImages,
  addOwnerId,
  createGallery,
  getAllGalleries,
  getGallery,
  getMyGallery,
  updateGallery,
  resizeAndUpdateGalleryImages,
  deleteGallery,
  deleteGalleryImages,
  countGalleries,
} = require("./gallery.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");

const {
  createGalleryValidator,
  getGalleryValidator,
  updateGalleryValidator,
  deleteGalleryValidator,
} = require("./gallery.validation");

//Employee nested routes
const employeeRouter = require("../employees/employee.routes");
router.use("/:galleryId/employees", employeeRouter);

const productRouter = require("../products/product.routes");
router.use("/:galleryId/products", productRouter);

// count before :id otherwise "count" is treated as :id
router.get("/count", countGalleries);

//resizeGallaryImages must be used after updateGalleryValidator so the slug is ready
router
  .route("/")
  .get(getAllGalleries)
  .post(
    protect,
    allowTo([ROLES.GALLERY_OWNER]),
    uploadgalleryImages,
    createGalleryValidator,
    resizeGalleryImages,
    addOwnerId,
    createGallery,
  );

router.get(
  "/my-gallery",
  protect,
  allowTo([ROLES.GALLERY_OWNER]),
  getMyGallery,
);

router
  .route("/:id")
  .get(getGalleryValidator, getGallery)
  .put(
    protect,
    allowTo([ROLES.ADMIN, ROLES.GALLERY_OWNER]),
    uploadgalleryImages,
    updateGalleryValidator,
    resizeAndUpdateGalleryImages,
    updateGallery,
  )
  .delete(
    protect,
    allowTo([ROLES.ADMIN, ROLES.GALLERY_OWNER]),
    deleteGalleryValidator,
    deleteGalleryImages,
    deleteGallery,
  );


module.exports = router;
