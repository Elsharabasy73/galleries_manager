const { getPrisma } = require("../../config/prisma");
const ApiError = require("../../shared/utils/ApiError");

const prisma = getPrisma();

// Sum of live product prices x quantities, rounded to 2 decimals
const calculateTotalPrice = (items) =>
  Number(
    items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0).toFixed(2),
  );

// Normalize a possibly-missing cart into a stable response shape
const buildCartResponse = (cart) =>
  cart
    ? {
        id: cart.id,
        items: cart.items,
        totalPrice: calculateTotalPrice(cart.items),
      }
    : {
        id: null,
        items: [],
        totalPrice: 0,
      };

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

// Get the user's cart with items, product data, and computed total price
exports.getMyCart = async (userId) => {
  const cart = await getMyCartQuery(userId);

  return buildCartResponse(cart);
};

// Add a product to the user's cart (merges/increments when already present)
exports.addItem = async (userId, productId, quantity) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });

  if (!product) {
    throw new ApiError("Product not found", 404);
  }

  if (product.status !== "active") {
    throw new ApiError("Product is not available", 400);
  }

  // Cart has a unique userId, so upsert creates or returns the current cart
  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
  });

  const requestedQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (requestedQuantity > product.stock) {
    throw new ApiError(
      `Requested quantity exceeds available stock (${product.stock})`,
      400,
    );
  }

  await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    update: { quantity: requestedQuantity },
    create: {
      cartId: cart.id,
      productId,
      quantity: requestedQuantity,
    },
  });

  const updatedCart = await getMyCartQuery(userId);

  return buildCartResponse(updatedCart);
};

// Replace the quantity of one cart item
exports.updateItemQuantity = async (userId, productId, quantity) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    throw new ApiError("Product is not in your cart", 404);
  }

  const item = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId: cart.id,
        productId,
      },
    },
    include: { product: true },
  });

  if (!item) {
    throw new ApiError("Product is not in your cart", 404);
  }

  if (quantity > item.product.stock) {
    throw new ApiError(
      `Requested quantity exceeds available stock (${item.product.stock})`,
      400,
    );
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
  });

  const updatedCart = await getMyCartQuery(userId);

  return buildCartResponse(updatedCart);
};

// Remove one product from the user's cart
// Returns true when an item was removed, false when it was not in the cart
exports.removeItem = async (userId, productId) => {
  const result = await prisma.cartItem.deleteMany({
    where: {
      productId,
      cart: { userId },
    },
  });

  return result.count > 0;
};

// Remove every item from the user's cart (the cart itself stays)
exports.clearCart = async (userId) => {
  await prisma.cartItem.deleteMany({
    where: { cart: { userId } },
  });
};
