const factory = require("../../controllers/handleFactory");
const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();
//@desc Create a new gallery
//@route POST /api/v1/galleries
//@access Private (gallery_owner)
const createCategory = factory.createOne(prisma.category);

//@desc Get all category
//@route GET /api/v1/category
//@access public
const getAllCategory = factory.getAll(prisma.category);

//@desc Get a gallery by id
//@route GET /api/v1/category/:id
//@access public
const getCategory = factory.getOne(prisma.category);

//@desc Update a gallery by id
//@route PUT /api/v1/category/:id
//@access Private (admin)
const updateCategory = factory.updateOne(prisma.category);

//@desc Delete a gallery by id
//@route DELETE /api/v1/category/:id
//@access Private (admin)
const deleteCategory = factory.deleteOne(prisma.category);

module.exports = {
  createCategory,
  getCategory,
  updateCategory,
  getAllCategory,
  deleteCategory,
};
