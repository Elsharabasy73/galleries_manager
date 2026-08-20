const express = require("express");

const router = express.Router();
const {
  uploadgalleryImages,
  resizeGalleryImages,
  addOwnerId,
  createGallery,
  getAllGalleries,
  getGallery,
  updateGallery,
  resizeAndUpdateGalleryImages,
  deleteGallery,
  deleteGalleryImages,
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

router
  .route("/:id")
  .get(getGalleryValidator, getGallery)
  .put(
    protect,
    allowTo([ROLES.GALLERY_OWNER]),
    uploadgalleryImages,
    updateGalleryValidator,
    resizeAndUpdateGalleryImages,
    updateGallery,
  )
  .delete(
    protect,
    allowTo([ROLES.GALLERY_OWNER, ROLES.ADMIN]),
    deleteGalleryValidator,
    deleteGalleryImages,
    deleteGallery,
  );

module.exports = router;
