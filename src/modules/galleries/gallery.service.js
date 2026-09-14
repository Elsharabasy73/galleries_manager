const { getPrisma } = require("../../config/prisma");
const ApiError = require("../../shared/utils/ApiError");
const { ROLES } = require("../../shared/constants/roles");

const getMyGallery = async (req) => {
  const prisma = getPrisma();
  let gallery;
  if (ROLES.GALLERY_OWNER === req.user.role) {
    gallery = await prisma.gallery.findUnique({
      where: { ownerId: req.user.id },
    });
  } else if (ROLES.EMPLOYEE === req.user.role) {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: { gallery: true },
    });
    gallery = employee.gallery;
  }

  if (!gallery) {
    throw new ApiError("Gallery not found", 404);
  }
  //count products in gallery
  const productCount = await prisma.product.count({
    where: {
      galleryId: gallery.id,
    },
  });

  //count employees in gallery
  const employeeCount = await prisma.employee.count({
    where: {
      galleryId: gallery.id,
    },
  });

  const galleryData = {
    ...gallery,
    productCount,
    employeeCount,
  };

  return galleryData;
};

module.exports = {
  getMyGallery,
};
