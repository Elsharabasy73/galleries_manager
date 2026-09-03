const { getPrisma } = require("../../config/prisma");

const ApiError = require("../../shared/utils/ApiError");
const { ORDER_STATUS } = require("./order.constants");

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

  // Re-validate every line with live product data (may have changed since added).
  // Collect all problems and report them at once so the customer can decide
  // whether to drop the unavailable lines and retry. Nothing is created here.
  const unavailableItems = [];

  for (const item of galleryItems) {
    if (item.product.status !== "active") {
      unavailableItems.push({
        productId: item.productId,
        productName: item.product.name,
        reason: "not_available",
      });
    } else if (item.quantity > item.product.stock) {
      unavailableItems.push({
        productId: item.productId,
        productName: item.product.name,
        reason: "insufficient_stock",
        availableStock: item.product.stock,
        requestedQuantity: item.quantity,
      });
    }
  }

  if (unavailableItems.length > 0) {
    throw new ApiError("Some items in your cart are no longer available", 400, {
      unavailableItems,
    });
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

    // Decrement stock with an atomic guard: if another checkout grabbed the
    // units after our pre-check, updateMany matches nothing and we abort with
    // the same itemized 400. Throwing here rolls back the whole transaction,
    // so no partial order is ever kept.
    for (const item of galleryItems) {
      const decremented = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });

      if (decremented.count === 0) {
        const fresh = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const reason =
          !fresh || fresh.status !== "active"
            ? "not_available"
            : "insufficient_stock";

        throw new ApiError(
          "Some items in your cart are no longer available",
          400,
          {
            unavailableItems: [
              {
                productId: item.productId,
                productName: item.product.name,
                reason,
                ...(reason === "insufficient_stock" && {
                  availableStock: fresh.stock,
                  requestedQuantity: item.quantity,
                }),
              },
            ],
          },
        );
      }
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
    data: { status: ORDER_STATUS.ACCEPTED },
    include: { items: true, gallery: true },
  });

  return updated;
};
