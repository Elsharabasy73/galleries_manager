const { getPrisma } = require("../../config/prisma");

const ApiError = require("../../shared/utils/ApiError");
const { ROLES } = require("../../shared/constants/roles");
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

// List orders based on user role with intelligent filtering
exports.getOrders = async (user) => {
  let where = {};

  if (user.role === ROLES.USER) {
    // Regular users see only their own orders
    where.userId = user.id;
  } else if (user.role === ROLES.GALLERY_OWNER) {
    // Gallery owners see orders for their gallery
    const gallery = await prisma.gallery.findUnique({
      where: { ownerId: user.id },
    });
    if (!gallery) {
      throw new ApiError("Gallery not found", 404);
    }
    where.galleryId = gallery.id;
  } else if (user.role === ROLES.EMPLOYEE) {
    // Employees see orders for their gallery
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
    });
    if (!employee) {
      throw new ApiError("Employee not found", 404);
    }
    where.galleryId = employee.galleryId;
  }
  // Admin sees all orders (no where clause filter)

  return prisma.order.findMany({
    where,
    include: {
      items: true,
      gallery: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// List the current user's orders, newest first (kept for backward compatibility)
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
