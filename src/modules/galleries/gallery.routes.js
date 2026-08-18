const express = require("express");

const router = express.Router();
const { uploadgalleryImages, createGallery } = require("./gallery.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const { createGalleryValidator } = require("./gallery.validation");

router
  .route("/")
  .post(
    protect,
    allowTo(["gallery_owner"]),
    uploadgalleryImages,
    createGalleryValidator,
    createGallery,
  );

module.exports = router;
