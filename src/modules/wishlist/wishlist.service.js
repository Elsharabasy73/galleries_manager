const { getPrisma } = require("../../config/prisma");

const prisma = getPrisma();

// Get all wishlist items of a user, newest first, with product data
exports.getMyWishlist = (userId) =>
  prisma.wishlistItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

// Add a product to the user's wishlist (idempotent)
exports.addToWishlist = (userId, productId) =>
  prisma.wishlistItem.upsert({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
    update: {},
    create: {
      userId,
      productId,
    },
    include: { product: true },
  });

// Remove a product from the user's wishlist
// Returns true when an item was removed, false when it was not wishlisted
exports.removeFromWishlist = async (userId, productId) => {
  const result = await prisma.wishlistItem.deleteMany({
    where: {
      userId,
      productId,
    },
  });

  return result.count > 0;
};
