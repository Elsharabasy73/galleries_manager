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

  req.body.galleryId = galleryId;
  req.body.createdById = req.user.id;
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

const createProduct = factory.createOne(prisma.product);

const getAllProducts = factory.getAll(prisma.product, "product", {gallery: true});

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
};