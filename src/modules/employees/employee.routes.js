const express = require("express");

const router = express.Router({ mergeParams: true });
const {
  createEmployee,
  getAllEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./employee.controller");

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");

const {
  createEmployeeValidator,
  getEmployeeValidator,
  updateEmployeeValidator,
  deleteEmployeeValidator,
} = require("./employee.validation");

router
  .route("/")
  .get(protect, allowTo([ROLES.GALLERY_OWNER, ROLES.ADMIN]), getAllEmployees)
  .post(
    protect,
    allowTo([ROLES.GALLERY_OWNER, ROLES.ADMIN]),
    createEmployeeValidator,
    createEmployee,
  );

router
  .route("/:id")
  .get(
    protect,
    allowTo([ROLES.EMPLOYEE, ROLES.GALLERY_OWNER, ROLES.ADMIN]),
    getEmployeeValidator,
    getEmployee,
  )
  .put(
    protect,
    allowTo([ROLES.GALLERY_OWNER, ROLES.EMPLOYEE]),
    updateEmployeeValidator,
    updateEmployee,
  )
  .delete(
    protect,
    allowTo([ROLES.GALLERY_OWNER, ROLES.EMPLOYEE, ROLES.ADMIN]),
    deleteEmployeeValidator,
    deleteEmployee,
  );

module.exports = router;
