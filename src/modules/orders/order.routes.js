const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");

const { ROLES } = require("../../shared/constants/roles");

const {
  checkoutGallery,
  getOrders,
  getOrder,
  confirmOrder,
  checkGalleryOrderOwnership,
  checkOrderAccess,
} = require("./order.controller");

const {
  createOrderValidator,
  getOrderValidator,
  confirmOrderValidator,
} = require("./order.validation");

// Create / read orders (role-based filtering)
router
  .route("/")
  .get(
    protect,
    allowTo([ROLES.USER, ROLES.GALLERY_OWNER, ROLES.EMPLOYEE, ROLES.ADMIN]),
    getOrders,
  )
  .post(protect, allowTo([ROLES.USER]), createOrderValidator, checkoutGallery);

// Read one of your orders or confirm one pending order for your gallery
router
  .route("/:id")
  .get(protect, getOrderValidator, checkOrderAccess, getOrder)
  .patch(
    protect,
    allowTo([ROLES.GALLERY_OWNER, ROLES.EMPLOYEE, ROLES.ADMIN]),
    confirmOrderValidator,
    checkGalleryOrderOwnership,
    confirmOrder,
  );

module.exports = router;
