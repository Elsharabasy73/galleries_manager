const { getPrisma } = require("../../config/prisma");

const ApiError = require("../../shared/utils/ApiError");

const prisma = getPrisma();

// Load the user's cart with every item and their live product data
const getMyCartQuery = (userId) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

// Checkout a single gallery's items from the cart into one order
// Other galleries' items stay in the cart (each gallery has its own checkout)
exports.checkoutGallery = async (userId, galleryId, data) => {
  const cart = await getMyCartQuery(userId);

  if (!cart || cart.items.length === 0) {
    throw new ApiError("Your cart is empty", 400);
  }

  const galleryItems = cart.items.filter(
    (item) => item.product.galleryId === galleryId,
  );

  if (galleryItems.length === 0) {
    throw new ApiError("No items from this gallery in your cart", 404);
  }

  // Re-validate available stock with live product data (may have changed since added)
  for (const item of galleryItems) {
    if (item.quantity > item.product.stock) {
      throw new ApiError(
        `Requested quantity for "${item.product.name}" exceeds available stock (${item.product.stock})`,
        400,
      );
    }
  }

  const totalPrice = Number(
    galleryItems
      .reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      )
      .toFixed(2),
  );

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        galleryId,
        totalPrice,
        shippingAddress: data.shippingAddress,
        note: data.note,
        items: {
          create: galleryItems.map((item) => ({
            productId: item.productId,
            productName: item.product.name,
            imageUrl: item.product.mainImageUrl,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock and remove the checked-out items from the cart
    for (const item of galleryItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({
      where: {
        id: { in: galleryItems.map((item) => item.id) },
      },
    });

    return created;
  });

  return order;
};

// List the current user's orders, newest first
exports.getMyOrders = (userId) =>
  prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      gallery: true,
    },
    orderBy: { createdAt: "desc" },
  });

// Move a pending order to accepted once the gallery confirms it
exports.confirmOrder = async (orderId) => {
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "accepted" },
    include: { items: true, gallery: true },
  });

  return updated;
};
