const asyncHandler = require("express-async-handler");

const ApiError = require("../../shared/utils/ApiError");
const wishlistService = require("./wishlist.service");

// GET /api/v1/wishlist
exports.getMyWishlist = asyncHandler(async (req, res) => {
  const items = await wishlistService.getMyWishlist(req.user.id);

  res.status(200).json({
    results: items.length,
    data: items,
  });
});

// POST /api/v1/wishlist
exports.addToWishlist = asyncHandler(async (req, res) => {
  const item = await wishlistService.addToWishlist(
    req.user.id,
    req.body.productId,
  );

  res.status(201).json({
    data: item,
  });
});

// DELETE /api/v1/wishlist/:productId
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
  const removed = await wishlistService.removeFromWishlist(
    req.user.id,
    req.params.productId,
  );

  if (!removed) {
    return next(new ApiError("Product is not in your wishlist", 404));
  }

  res.status(204).send();
});
