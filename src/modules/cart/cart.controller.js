const asyncHandler = require("express-async-handler");

const ApiError = require("../../shared/utils/ApiError");
const cartService = require("./cart.service");

// GET /api/v1/cart
exports.getMyCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getMyCart(req.user.id);

  res.status(200).json({
    results: cart.items.length,
    data: cart,
  });
});

// POST /api/v1/cart
exports.addItemToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(
    req.user.id,
    req.body.productId,
    req.body.quantity ?? 1,
  );

  res.status(201).json({
    message: "Product added to your cart",
    data: cart,
  });
});

// PATCH /api/v1/cart/:productId
exports.updateCartItemQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(
    req.user.id,
    req.params.productId,
    req.body.quantity,
  );

  res.status(200).json({
    message: "Cart item updated",
    data: cart,
  });
});

// DELETE /api/v1/cart/:productId
exports.removeItemFromCart = asyncHandler(async (req, res, next) => {
  const removed = await cartService.removeItem(
    req.user.id,
    req.params.productId,
  );

  if (!removed) {
    return next(new ApiError("Product is not in your cart", 404));
  }

  res.status(204).send();
});

// DELETE /api/v1/cart
exports.clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCart(req.user.id);

  res.status(204).send();
});
