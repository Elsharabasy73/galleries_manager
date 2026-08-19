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
    allowTo(["admin"]),
    createCategoryValidator,
    createCategory,
  );

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    protect,
    allowTo(["admin"]),
    updateCategoryValidator,
    updateCategory,
  )
  .delete(
    protect,
    allowTo(["admin"]),
    deleteCategoryValidator,
    deleteCategory,
  );

module.exports = router;
