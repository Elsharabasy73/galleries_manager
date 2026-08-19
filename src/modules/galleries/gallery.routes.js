const express = require("express");

const router = express.Router();
const {
  uploadgalleryImages,
  resizeGallaryImages,
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

const {
  createGalleryValidator,
  getGalleryValidator,
  updateGalleryValidator,
  deleteGalleryValidator,
} = require("./gallery.validation");

//resizeGallaryImages must be used after updateGalleryValidator so the slug is ready
router
  .route("/")
  .get(getAllGalleries)
  .post(
    protect,
    allowTo(["gallery_owner"]),
    uploadgalleryImages,
    createGalleryValidator,
    resizeGallaryImages,
    addOwnerId,
    createGallery,
  );

router
  .route("/:id")
  .get(getGalleryValidator, getGallery)
  .put(
    protect,
    allowTo(["gallery_owner"]),
    uploadgalleryImages,
    updateGalleryValidator,
    resizeAndUpdateGalleryImages,
    updateGallery,
  )
  .delete(
    protect,
    allowTo(["gallery_owner"]),
    deleteGalleryValidator,
    deleteGalleryImages,
    deleteGallery,
  );

module.exports = router;
