const { getPrisma } = require("../../config/prisma");
// const prisma = getPrisma();


const getMyGallery = async (req) => {
  const prisma = getPrisma();
  const gallery = await prisma.gallery.findUnique({
    where: {
      ownerId: req.user.id,
    },
  });
  

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