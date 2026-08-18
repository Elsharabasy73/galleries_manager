const { getPrisma } = require("../../config/prisma");
const prisma = getPrisma();

const createGallery = async (data) => {
  console.log("falg");
  console.log(data);
  const gallery = await prisma.gallery.create({
    data: {
      ...data,
    },
  });
  console.log("falg2");

  return gallery;
};

module.exports = { createGallery };
