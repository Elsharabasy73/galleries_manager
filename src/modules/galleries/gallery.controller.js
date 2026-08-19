const fs = require("fs/promises");
const path = require("path");

const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

// const galleryService = require("./gallery.service");
const {
  uploadMixOfImages,
} = require("../../middlewares/uploadImage.middleware");
const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");
const {
  // getStorageFolderPath,
  STORAGE_TYPES,
  deleteStorageFolder,
  deleteStorageFile,
  deleteStorageFiles,
} = require("../../shared/utils/storage.utils");

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

//@desc Resize gallery images
//@route POST /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const resizeGallaryImages = asyncHandler(async (req, res, next) => {
  // Create a unique folder for this gallery
  const galleryFolderName = `${req.body.slug}-${uuidv4()}`;
  const date = new Date().toISOString().replace(/[:.]/g, "-");

  // storage/uploads/galleries/gallery-slug-uuid
  const galleryFolderPath = path.join(
    process.cwd(),
    "storage",
    "uploads",
    "galleries",
    galleryFolderName,
  );

  // Create the folder before saving images
  await fs.mkdir(galleryFolderPath, {
    recursive: true,
  });

  // Save folder name in database
  req.body.storageFolder = galleryFolderName;

  // =========================
  // 1. Process banner
  // =========================

  if (req.files?.banner?.length) {
    const bannerFileName = `banner-${date}-${uuidv4()}.jpeg`;
    await sharp(req.files.banner[0].buffer)
      .resize(1000, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(path.join(galleryFolderPath, bannerFileName));

    req.body.banner = bannerFileName;
  }

  // =========================
  // 2. Process logo
  // =========================

  if (req.files?.logo?.length) {
    const logoFileName = `logo-${date}-${uuidv4()}.jpeg`;

    await sharp(req.files.logo[0].buffer)
      .resize(500, 500, {
        fit: "contain",
      })
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(path.join(galleryFolderPath, logoFileName));

    req.body.logo = logoFileName;
  }

  // =========================
  // 3. Process gallery images
  // =========================

  if (req.files?.images?.length) {
    const imageNames = await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageFileName = `image-number-${index + 1}-${date}-${uuidv4()}.jpeg`;

        await sharp(img.buffer)
          .resize(1000, 500)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(path.join(galleryFolderPath, imageFileName));

        return imageFileName;
      }),
    );

    req.body.images = imageNames;
  }

  next();
});

const resizeAndUpdateGalleryImages = asyncHandler(async (req, res, next) => { 
  // Create a unique folder for this gallery
  const galleryFolderName = req.gallery.storageFolder
  const date = new Date().toISOString().replace(/[:.]/g, "-");

  // storage/uploads/galleries/gallery-slug-uuid
  const galleryFolderPath = path.join(
    process.cwd(),
    "storage",
    "uploads",
    "galleries",
    galleryFolderName,
  );

  // =========================
  // 1. Process banner
  // =========================

  if (req.files?.banner?.length) {
    const bannerFileName = `banner-${date}-${uuidv4()}.jpeg`;
    await sharp(req.files.banner[0].buffer)
      .resize(1000, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(path.join(galleryFolderPath, bannerFileName));

    req.body.banner = bannerFileName;
    await deleteStorageFile(
      STORAGE_TYPES.GALLERIES,
      req.gallery.storageFolder,
      req.gallery.banner,
    );
  }

  // =========================
  // 2. Process logo
  // =========================

  if (req.files?.logo?.length) {
    const logoFileName = `logo-${date}-${uuidv4()}.jpeg`;

    await sharp(req.files.logo[0].buffer)
      .resize(500, 500, {
        fit: "contain",
      })
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(path.join(galleryFolderPath, logoFileName));

    req.body.logo = logoFileName;
    await deleteStorageFile(
      STORAGE_TYPES.GALLERIES,
      req.gallery.storageFolder,
      req.gallery.logo,
    );
  }

  // =========================
  // 3. Process gallery images
  // =========================

  if (req.files?.images?.length) {
    const imageNames = await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageFileName = `image-number-${index + 1}-${date}-${uuidv4()}.jpeg`;

        await sharp(img.buffer)
          .resize(1000, 500)
          .toFormat("jpeg")
          .jpeg({ quality: 95 })
          .toFile(path.join(galleryFolderPath, imageFileName));

        return imageFileName;
      }),
    );
    await deleteStorageFiles(
      STORAGE_TYPES.GALLERIES,
      req.gallery.storageFolder,
      req.gallery.images,
    );
    req.body.images = imageNames;
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

//desc Get all galleries
//route GET /api/v1/galleries
//access Private (gallery_owner)
const getAllGalleries = factory.getAll(prisma.gallery);

//@desc Get a gallery by id
//@route GET /api/v1/galleries/:id
//@access Private (gallery_owner)
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
  resizeGallaryImages,
  addOwnerId,
  createGallery,
  getGallery,
  updateGallery,
  resizeAndUpdateGalleryImages,
  getAllGalleries,
  deleteGallery,
  deleteGalleryImages,
};
