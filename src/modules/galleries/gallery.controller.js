const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const {
  uploadMixOfImages,
} = require("../../middlewares/uploadImage.middleware");

const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");

const {
  STORAGE_TYPES,
  deleteStorageFiles,
  deleteStorageFolder,
} = require("../../shared/utils/storage/storage");

const {
  processImage,
  processImages,
} = require("../../shared/utils/storage/image.utils");

const galleryService = require("./gallery.service");

const prisma = getPrisma();

const uploadgalleryImages = uploadMixOfImages([
  { name: "banner", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

//@desc Resize gallery images
//@route POST /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const resizeGalleryImages = asyncHandler(async (req, res, next) => {
  // Create a unique folder for this gallery
  const galleryFolderName = `${req.body.slug}-${uuidv4()}`;

  // Save folder name in database
  req.body.storageFolder = galleryFolderName;
  if (req.body.images === undefined) {
    req.body.images = [];
  }
  req.uploadedGalleryImageNames = [];

  try {
    // Banner
    if (req.files?.banner?.length) {
      req.body.banner = await processImage({
        file: req.files.banner[0],
        type: STORAGE_TYPES.GALLERIES,
        folderName: galleryFolderName,
        prefix: "banner",
        width: 1000,
        height: 500,
      });
      req.uploadedGalleryImageNames.push(req.body.banner);
    }

    // Logo
    if (req.files?.logo?.length) {
      req.body.logo = await processImage({
        file: req.files.logo[0],
        type: STORAGE_TYPES.GALLERIES,
        folderName: galleryFolderName,
        prefix: "logo",
        width: 500,
        height: 500,
        options: {
          fit: "contain",
        },
      });
      req.uploadedGalleryImageNames.push(req.body.logo);
    }

    // Gallery images
    if (req.files?.images?.length) {
      req.body.images = await processImages({
        files: req.files.images,
        type: STORAGE_TYPES.GALLERIES,
        folderName: galleryFolderName,
        prefix: "gallery-image",
        width: 1000,
        height: 500,
      });
      req.uploadedGalleryImageNames.push(...req.body.images);
    }
  } catch (error) {
    await deleteStorageFolder(STORAGE_TYPES.GALLERIES, galleryFolderName);
    throw error;
  }

  next();
});

//@desc Resize and update gallery images
//@route PUT /api/v1/galleries/:id/images
//@access Private (gallery_owner)
const resizeAndUpdateGalleryImages = asyncHandler(async (req, res, next) => {
  req.uploadedGalleryImageNames = [];
  req.oldGalleryImageNames = [];
  const hasUploadedImages = Boolean(
    req.files?.banner?.length ||
    req.files?.logo?.length ||
    req.files?.images?.length,
  );
  const storageFolder =
    req.gallery.storageFolder ||
    (hasUploadedImages ? `${req.gallery.slug}-${uuidv4()}` : undefined);

  if (storageFolder && !req.gallery.storageFolder) {
    req.body.storageFolder = storageFolder;
  }

  try {
    // Replace banner
    if (req.files?.banner?.length) {
      req.body.banner = await processImage({
        file: req.files.banner[0],
        type: STORAGE_TYPES.GALLERIES,
        folderName: storageFolder,
        prefix: "banner",
        width: 1000,
        height: 500,
      });
      req.uploadedGalleryImageNames.push(req.body.banner);
      if (req.gallery.banner) {
        req.oldGalleryImageNames.push(req.gallery.banner);
      }
    }

    // Replace logo
    if (req.files?.logo?.length) {
      req.body.logo = await processImage({
        file: req.files.logo[0],
        type: STORAGE_TYPES.GALLERIES,
        folderName: storageFolder,
        prefix: "logo",
        width: 500,
        height: 500,
        options: {
          fit: "contain",
        },
      });
      req.uploadedGalleryImageNames.push(req.body.logo);
      if (req.gallery.logo) {
        req.oldGalleryImageNames.push(req.gallery.logo);
      }
    }

    // Replace gallery images
    if (req.files?.images?.length) {
      req.body.images = await processImages({
        files: req.files.images,
        type: STORAGE_TYPES.GALLERIES,
        folderName: storageFolder,
        prefix: "image",
        width: 1000,
        height: 500,
      });
      req.uploadedGalleryImageNames.push(...req.body.images);
      req.oldGalleryImageNames.push(...req.gallery.images);
    }
  } catch (error) {
    if (req.uploadedGalleryImageNames.length) {
      await deleteStorageFiles(
        STORAGE_TYPES.GALLERIES,
        storageFolder,
        req.uploadedGalleryImageNames,
      );
    }
    throw error;
  }

  next();
});

//@desc Add owner id to gallery
const addOwnerId = asyncHandler(async (req, res, next) => {
  req.body.ownerId = req.user.id;
  next();
});

const getMyGallery = asyncHandler(async (req, res) => {
  const gallery = await galleryService.getMyGallery(req);

  res.status(200).json({
    status: "success",
    data: gallery,
  });
});

//@desc Create a new gallery
//@route POST /api/v1/galleries
//@access Private (gallery_owner)
const createGallery = asyncHandler(async (req, res) => {
  let gallery;

  try {
    gallery = await prisma.gallery.create({ data: req.body });
  } catch (error) {
    if (req.body.storageFolder) {
      await deleteStorageFolder(
        STORAGE_TYPES.GALLERIES,
        req.body.storageFolder,
      );
    }
    throw error;
  }

  res.status(201).json({ data: gallery });
});

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
const updateGallery = asyncHandler(async (req, res) => {
  let gallery;

  try {
    gallery = await prisma.gallery.update({
      where: { id: req.gallery.id },
      data: req.body,
    });
  } catch (error) {
    if (req.uploadedGalleryImageNames.length) {
      await deleteStorageFiles(
        STORAGE_TYPES.GALLERIES,
        req.gallery.storageFolder,
        req.uploadedGalleryImageNames,
      );
    }
    throw error;
  }

  if (req.oldGalleryImageNames.length) {
    await deleteStorageFiles(
      STORAGE_TYPES.GALLERIES,
      req.gallery.storageFolder,
      req.oldGalleryImageNames,
    );
  }

  res.status(200).json({ data: gallery });
});

//@desc Delete a gallery by id
//@route DELETE /api/v1/galleries/:id
//@access Private (gallery_owner)
const deleteGallery = asyncHandler(async (req, res) => {
  await prisma.gallery.delete({ where: { id: req.gallery.id } });
  await deleteStorageFolder(STORAGE_TYPES.GALLERIES, req.gallery.storageFolder);
  res.status(204).send();
});

//@desc Get number of galleries
//@route GET /api/v1/galleries/count
//@access Public
const countGalleries = asyncHandler(async (req, res) => {
  const count = await prisma.gallery.count();
  res.status(200).json({
    status: "success",
    data: {
      count,
    },
  });
});

module.exports = {
  uploadgalleryImages,
  resizeGalleryImages,
  resizeAndUpdateGalleryImages,
  addOwnerId,
  createGallery,
  getGallery,
  getMyGallery,
  updateGallery,
  getAllGalleries,
  deleteGallery,
  countGalleries,
};
