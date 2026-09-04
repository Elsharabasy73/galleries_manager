const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");
const asyncHandler = require("express-async-handler");
const ApiError = require("../../shared/utils/ApiError");

const prisma = getPrisma();

const getCallerGalleryId = async (user) => {
  if (user.role === "gallery_owner") {
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

  if (!req.body) req.body = {};
  req.body.galleryId = galleryId;
  req.body.createdById = req.user.id;
  // ---- FormData coercion: only schema fields, correct types for Prisma ----
  // Prisma expects stock Int, price/compareAtPrice Decimal, isFeatured Boolean
  // FormData sends everything as string, so coerce here (frontend also sends only schema fields)
  if (req.body.stock !== undefined && typeof req.body.stock === 'string') {
    const v = parseInt(req.body.stock, 10);
    if (!isNaN(v)) req.body.stock = v;
    else delete req.body.stock; // fallback to default 0
  }
  if (req.body.price !== undefined && typeof req.body.price === 'string' && req.body.price.trim() !== '') {
    // Decimal accepts string, keep as string but ensure numeric
    const v = Number(req.body.price);
    if (!isNaN(v)) req.body.price = String(v);
    else delete req.body.price;
  }
  if (req.body.compareAtPrice !== undefined) {
    if (typeof req.body.compareAtPrice === 'string' && req.body.compareAtPrice.trim() === '') delete req.body.compareAtPrice;
    else if (typeof req.body.compareAtPrice === 'string') {
      const v = Number(req.body.compareAtPrice);
      if (!isNaN(v)) req.body.compareAtPrice = String(v);
    }
  }
  if (req.body.isFeatured !== undefined && typeof req.body.isFeatured === 'string') {
    if (req.body.isFeatured === 'true') req.body.isFeatured = true;
    else if (req.body.isFeatured === 'false') req.body.isFeatured = false;
    else delete req.body.isFeatured;
  }
  // non-schema guard: remove category (typo categoy) etc if accidentally sent
  delete req.body.category;
  delete req.body.categoy;
  delete req.body.image;
  delete req.body.mainImage;
  // materials: String[] - handle JSON string vs repeated fields
  if (req.body.materials !== undefined && typeof req.body.materials === 'string') {
    try {
      const parsed = JSON.parse(req.body.materials);
      if (Array.isArray(parsed)) req.body.materials = parsed;
    } catch {
      // single value will be handled as array with one entry by multer repeat, keep string as array
      if (!Array.isArray(req.body.materials)) req.body.materials = [req.body.materials];
    }
  }
  next();
});

const checkProductOwnership = asyncHandler(async (req, res, next) => {
  const galleryId = await getCallerGalleryId(req.user);

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

const createProduct = factory.createOne(prisma.product);

const getAllProducts = factory.getAll(prisma.product, "product", {
  gallery: true,
});

const getProduct = factory.getOne(prisma.product);

const updateProduct = factory.updateOne(prisma.product);

const deleteProduct = factory.deleteOne(prisma.product);

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  setGalleryAndCreator,
  checkProductOwnership,
  setGalleryIdFilter,
};
