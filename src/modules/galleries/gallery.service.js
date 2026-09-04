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
  return gallery;
};

module.exports = {
  getMyGallery,
};