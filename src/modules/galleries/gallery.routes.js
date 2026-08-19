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
  deleteGallery,
} = require("./gallery.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const {
  createGalleryValidator,
  getGalleryValidator,
  updateGalleryValidator,
  deleteGalleryValidator,
} = require("./gallery.validation");

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
    resizeGallaryImages,
    updateGalleryValidator,
    updateGallery,
  )
  .delete(
    protect,
    allowTo(["gallery_owner"]),
    deleteGalleryValidator,
    deleteGallery,
  );

module.exports = router;
