const asyncHandler = require("express-async-handler");

const ApiError = require("../../shared/utils/ApiError");
const { getPrisma } = require("../../config/prisma");
const { ROLES } = require("../../shared/constants/roles");
const { ORDER_STATUS } = require("./order.constants");
const orderService = require("./order.service");

const prisma = getPrisma();

// Gallery id of the caller: owner -> their gallery, employee -> their gallery
const getCallerGalleryId = async (user) => {
  if (user.role === "gallery_owner") {
    const gallery = await prisma.gallery.findUnique({
      where: { ownerId: user.id },
    });
    return gallery?.id;
  }

  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
  });
  return employee?.galleryId;
};

// Gallery member can manage an order only if it belongs to their gallery
const checkGalleryOrderOwnership = asyncHandler(async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  const galleryId = await getCallerGalleryId(req.user);

  if (req.order.galleryId !== galleryId) {
    return next(
      new ApiError("You can only manage orders in your own gallery", 403),
    );
  }
  next();
});

// The order's owner, or a member of the order's gallery, can view an order
const checkOrderAccess = asyncHandler(async (req, res, next) => {
  if (req.user.role === ROLES.ADMIN || req.order.userId === req.user.id) {
    return next();
  }

  const galleryId = await getCallerGalleryId(req.user);

  if (req.order.galleryId !== galleryId) {
    return next(new ApiError("You are not allowed to view this order", 403));
  }
  next();
});

// POST /api/v1/orders -> checkout the selected gallery's items from the cart
const checkoutGallery = asyncHandler(async (req, res) => {
  const order = await orderService.checkoutGallery(
    req.user.id,
    req.body.galleryId,
    {
      shippingAddress: req.body.shippingAddress,
      note: req.body.note,
    },
  );

  res.status(201).json({
    message: "Order placed successfully",
    data: order,
  });
});

// GET /api/v1/orders -> list the current user's orders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.id);

  res.status(200).json({
    results: orders.length,
    data: orders,
  });
});

// GET /api/v1/orders/:id -> get one order the user owns
const getOrder = asyncHandler(async (req, res) => {
  res.status(200).json({
    data: req.order,
  });
});

// PATCH /api/v1/orders/:id -> accept a pending order
const confirmOrder = asyncHandler(async (req, res, next) => {
  if (req.order.status !== ORDER_STATUS.PENDING) {
    return next(new ApiError("Only pending orders can be confirmed", 400));
  }

  const order = await orderService.confirmOrder(req.order.id);

  res.status(200).json({
    message: "Order confirmed",
    data: order,
  });
});

module.exports = {
  checkoutGallery,
  getMyOrders,
  getOrder,
  confirmOrder,
  checkGalleryOrderOwnership,
  checkOrderAccess,
};
