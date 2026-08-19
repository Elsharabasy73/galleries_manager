const fs = require("fs/promises");
const path = require("path");

const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const {
  uploadMixOfImages,
} = require("../../middlewares/uploadImage.middleware");

const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");

const {
  STORAGE_TYPES,
  deleteStorageFolder,
} = require("../../shared/utils/storage.utils");

const {
  processImage,
  processImages,
  replaceImage,
  replaceImages,
} = require("../../shared/utils/image.utils");

const prisma = getPrisma();

const uploadgalleryImages = uploadMixOfImages([
  { name: "banner", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

//@desc Delete gallery images
//@route DELETE /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const deleteGalleryImages = asyncHandler(async (req, res, next) => {
  await deleteStorageFolder(STORAGE_TYPES.GALLERIES, req.gallery.storageFolder);

  next();
});

const createStoragePath = (pathEndPoint) =>
  path.join(process.cwd(), "storage", "uploads", "galleries", pathEndPoint);

//@desc Resize gallery images
//@route POST /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const resizeGalleryImages = asyncHandler(async (req, res, next) => {
  // Create a unique folder for this gallery
  const galleryFolderName = `${req.body.slug}-${uuidv4()}`;

  const galleryFolderPath = createStoragePath(galleryFolderName);
  // Create folder before saving images
  await fs.mkdir(galleryFolderPath, {
    recursive: true,
  });

  // Save folder name in database
  req.body.storageFolder = galleryFolderName;

  // Banner
  if (req.files?.banner?.length) {
    req.body.banner = await processImage({
      file: req.files.banner[0],
      folderPath: galleryFolderPath,
      prefix: "banner",
      width: 1000,
      height: 500,
    });
  }

  // Logo
  if (req.files?.logo?.length) {
    req.body.logo = await processImage({
      file: req.files.logo[0],
      folderPath: galleryFolderPath,
      prefix: "logo",
      width: 500,
      height: 500,
      options: {
        fit: "contain",
      },
    });
  }

  // Gallery images
  if (req.files?.images?.length) {
    req.body.images = await processImages({
      files: req.files.images,
      folderPath: galleryFolderPath,
      prefix: "image",
      width: 1000,
      height: 500,
    });
  }

  next();
});

//@desc Resize and update gallery images
//@route PUT /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const resizeAndUpdateGalleryImages = asyncHandler(async (req, res, next) => {
  const galleryFolderPath = createStoragePath(req.gallery.storageFolder);

  // Replace banner
  if (req.files?.banner?.length) {
    req.body.banner = await replaceImage({
      file: req.files.banner[0],
      folderPath: galleryFolderPath,
      storageFolder: req.gallery.storageFolder,
      oldFileName: req.gallery.banner,
      prefix: "banner",
      width: 1000,
      height: 500,
    });
  }

  // Replace logo
  if (req.files?.logo?.length) {
    req.body.logo = await replaceImage({
      file: req.files.logo[0],
      folderPath: galleryFolderPath,
      storageFolder: req.gallery.storageFolder,
      oldFileName: req.gallery.logo,
      prefix: "logo",
      width: 500,
      height: 500,
      options: {
        fit: "contain",
      },
    });
  }

  // Replace gallery images
  if (req.files?.images?.length) {
    req.body.images = await replaceImages({
      files: req.files.images,
      folderPath: galleryFolderPath,
      storageFolder: req.gallery.storageFolder,
      oldFileNames: req.gallery.images,
      prefix: "image",
      width: 1000,
      height: 500,
    });
  }

  next();
});

//@desc Add owner id to gallery
const addOwnerId = asyncHandler(async (req, res, next) => {
  req.body.ownerId = req.user.id;
  next();
});

//@desc Create a new gallery
//@route POST /api/v1/galleries
//@access Private (gallery_owner)
const createGallery = factory.createOne(prisma.gallery);

//@desc Get all galleries
//@route GET /api/v1/galleries
//@access public
const getAllGalleries = factory.getAll(prisma.gallery);

//@desc Get a gallery by id
//@route GET /api/v1/galleries/:id
//@access public
const getGallery = factory.getOne(prisma.gallery);

//@desc Update a gallery by id
//@route PUT /api/v1/galleries/:id
//@access Private (gallery_owner)
const updateGallery = factory.updateOne(prisma.gallery);

//@desc Delete a gallery by id
//@route DELETE /api/v1/galleries/:id
//@access Private (gallery_owner)
const deleteGallery = factory.deleteOne(prisma.gallery);

module.exports = {
  uploadgalleryImages,
  resizeGalleryImages,
  resizeAndUpdateGalleryImages,
  addOwnerId,
  createGallery,
  getGallery,
  updateGallery,
  getAllGalleries,
  deleteGallery,
  deleteGalleryImages,
};
