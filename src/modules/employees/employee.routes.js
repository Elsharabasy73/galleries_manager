const express = require("express");

const router = express.Router();
const {
  createEmployee,
  getAllEmployee,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./employee.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const {
  createEmployeeValidator,
  getEmployeeValidator,
  updateEmployeeValidator,
  deleteEmployeeValidator,
} = require("./employee.validation");

router
  .route("/")
  .get(getAllEmployee)
  .post(
    protect,
    allowTo(["admin"]),
    createEmployeeValidator,
    createEmployee,
  );

router
  .route("/:id")
  .get(getEmployeeValidator, getEmployee)
  .put(
    protect,
    allowTo(["admin"]),
    updateEmployeeValidator,
    updateEmployee,
  )
  .delete(
    protect,
    allowTo(["admin"]),
    deleteEmployeeValidator,
    deleteEmployee,
  );

module.exports = router;
