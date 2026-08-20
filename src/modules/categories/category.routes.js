const express = require("express");

const router = express.Router();
const {
  createCategory,
  getAllCategory,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("./category.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");

const {
  createCategoryValidator,
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require("./category.validation");

router
  .route("/")
  .get(getAllCategory)
  .post(
    protect,
    allowTo([ROLES.ADMIN]),
    createCategoryValidator,
    createCategory,
  );

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(protect, allowTo([ROLES.ADMIN]), updateCategoryValidator, updateCategory)
  .delete(
    protect,
    allowTo([ROLES.ADMIN]),
    deleteCategoryValidator,
    deleteCategory,
  );

module.exports = router;
