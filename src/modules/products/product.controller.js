const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const ApiError = require("../../shared/utils/ApiError");
const { ROLES } = require("../../shared/constants/roles");
const {
  deleteStorageKey,
  STORAGE_TYPES,
} = require("../../shared/utils/storage/storage");
const {
  processImage,
  processImages,
} = require("../../shared/utils/storage/image.utils");

const prisma = getPrisma();

const getCallerGalleryId = async (user) => {
  if (user.role === ROLES.GALLERY_OWNER) {
    const gallery = await prisma.gallery.findUnique({
      where: { ownerId: user.id },
    });
    return gallery?.id;
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
  });
  return employee?.galleryId;
};

const setGalleryAndCreator = asyncHandler(async (req, res, next) => {
  const galleryId = await getCallerGalleryId(req.user);

  if (!galleryId) {
    return next(new ApiError("You do not belong to a gallery", 403));
  }

  if (req.params.galleryId && req.params.galleryId !== galleryId) {
    return next(
      new ApiError("You can only manage products in your own gallery", 403),
    );
  }

  req.body.galleryId = galleryId;
  req.body.createdById = req.user.id;
  next();
});

const checkProductOwnership = asyncHandler(async (req, res, next) => {
  const galleryId = await getCallerGalleryId(req.user);

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (req.product.galleryId !== galleryId) {
    return next(
      new ApiError("You can only manage products in your own gallery", 403),
    );
  }

  next();
});

const setGalleryIdFilter = asyncHandler(async (req, res, next) => {
  const { galleryId } = req.params;

  if (!galleryId) {
    return next();
  }

  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
  });

  if (!gallery) {
    return next(new ApiError("Gallery not found", 404));
  }

  req.query.galleryId = galleryId;
  next();
});

const getProductImageRefs = (product) => [
  ...new Set(
    [product?.mainImageUrl, ...(product?.images || [])].filter(Boolean),
  ),
];

const deleteProductImageRefs = async (refs) => {
  const storageRefs = [...new Set(refs)].filter(
    (ref) => typeof ref === "string" && !/^https?:\/\//i.test(ref),
  );

  await Promise.all(
    storageRefs.map((ref) => deleteStorageKey(STORAGE_TYPES.PRODUCTS, ref)),
  );
};

const processProductImages = asyncHandler(async (req, res, next) => {
  req.uploadedProductImageRefs = [];
  req.oldProductImageRefs = [];

  const primaryFile =
    req.files?.mainImage?.[0] ||
    req.files?.mainImageUrl?.[0] ||
    req.files?.image?.[0];
  const extraFiles = req.files?.images || [];

  if (!primaryFile && !extraFiles.length) {
    if (req.method === "POST" && req.body.images === undefined) {
      req.body.images = [];
    }
    return next();
  }

  const folderName = `${req.body.slug || req.product.slug}-${uuidv4()}`;
  let primaryImageRef;
  let extraImageRefs = [];

  try {
    if (primaryFile) {
      const fileName = await processImage({
        file: primaryFile,
        type: STORAGE_TYPES.PRODUCTS,
        folderName,
        prefix: "main-image",
        width: 1000,
        height: 1000,
      });
      primaryImageRef = `${folderName}/${fileName}`;
      req.uploadedProductImageRefs.push(primaryImageRef);
    }

    if (extraFiles.length) {
      const fileNames = await processImages({
        files: extraFiles,
        type: STORAGE_TYPES.PRODUCTS,
        folderName,
        prefix: "image",
        width: 1000,
        height: 1000,
      });
      extraImageRefs = fileNames.map((fileName) => `${folderName}/${fileName}`);
      req.uploadedProductImageRefs.push(...extraImageRefs);
    }
  } catch (error) {
    if (req.uploadedProductImageRefs.length) {
      await deleteProductImageRefs(req.uploadedProductImageRefs);
    }
    throw error;
  }

  if (!primaryImageRef && extraImageRefs.length) {
    [primaryImageRef] = extraImageRefs;
  }

  const previousMainImage = req.product?.mainImageUrl;
  const previousImages = req.product?.images || [];
  let nextImages = [...previousImages];

  if (extraImageRefs.length) {
    nextImages = [...extraImageRefs];
  }

  if (primaryImageRef) {
    if (previousMainImage && nextImages.includes(previousMainImage)) {
      nextImages = nextImages.map((ref) =>
        ref === previousMainImage ? primaryImageRef : ref,
      );
    } else if (!nextImages.includes(primaryImageRef)) {
      nextImages.unshift(primaryImageRef);
    }
    req.body.mainImageUrl = primaryImageRef;
  }

  req.body.images = [...new Set(nextImages)];
  req.oldProductImageRefs = getProductImageRefs(req.product).filter(
    (ref) => ref !== req.body.mainImageUrl && !req.body.images.includes(ref),
  );

  next();
});

const createProduct = asyncHandler(async (req, res) => {
  let product;

  try {
    product = await prisma.product.create({ data: req.body });
  } catch (error) {
    if (req.uploadedProductImageRefs.length) {
      await deleteProductImageRefs(req.uploadedProductImageRefs);
    }
    throw error;
  }

  res.status(201).json({ data: product });
});

const getAllProducts = factory.getAll(prisma.product, "product", {
  gallery: true,
});

const getProduct = factory.getOne(prisma.product, {
  gallery: true,
});

const updateProduct = asyncHandler(async (req, res) => {
  let product;

  try {
    product = await prisma.product.update({
      where: { id: req.product.id },
      data: req.body,
    });
  } catch (error) {
    if (req.uploadedProductImageRefs.length) {
      await deleteProductImageRefs(req.uploadedProductImageRefs);
    }
    throw error;
  }

  if (req.oldProductImageRefs.length) {
    await deleteProductImageRefs(req.oldProductImageRefs);
  }

  res.status(200).json({ data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await prisma.product.delete({ where: { id: req.product.id } });
  await deleteProductImageRefs(getProductImageRefs(req.product));
  res.status(204).send();
});

//@desc Get number of products
//@route GET /api/v1/products/count
//@access Public
const countProducts = asyncHandler(async (req, res) => {
  const count = await prisma.product.count();
  res.status(200).json({
    status: "success",
    data: {
      count,
    },
  });
});
module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  setGalleryAndCreator,
  checkProductOwnership,
  setGalleryIdFilter,
  countProducts,
  processProductImages,
};
