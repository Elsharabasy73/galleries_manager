const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const galleryService = require("./gallery.service");
const {
  uploadMixOfImages,
} = require("../../middlewares/uploadImage.middleware");

const uploadgalleryImages = uploadMixOfImages([
  {
    name: "banner",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 5,
  },
]);

exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  //1- Image processing for banner
  if (req.files.banner) {
    const bannerFileName = `gallery-${uuidv4()}-${Date.now().toString()}-cover.jpeg`;

    await sharp(req.files.banner[0].buffer)
      .resize(1000, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/galleries/${bannerFileName}`);

    // Save image into our db
    req.body.banner = bannerFileName;
  }
  //2- Image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `gallery-${uuidv4()}-${Date.now().toString()}-${index + 1}.jpeg`;

        await sharp(img.buffer)
          .resize(2000, 1333)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(`uploads/galleries/${imageName}`);

        // Save image into our db
        req.body.images.push(imageName);
      }),
    );
  }
  next();
});

//@desc Create a new gallery
//@route POST /api/v1/galleries
//@access Private (gallery_owner)
const createGallery = asyncHandler(async (req, res) => {
  req.body.ownerId = req.user.id;
  const gallery = await galleryService.createGallery(req.body);
  res.status(201).json({
    status: "success",
    data: gallery,
  });
});

module.exports = { uploadgalleryImages, createGallery };
