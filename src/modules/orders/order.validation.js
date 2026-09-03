const { check, param } = require("express-validator");

const { getPrisma } = require("../../config/prisma");
const validatorMiddleware = require("../../middlewares/validation.middleware");

const prisma = getPrisma();

// Gallery in the body -> required, must exist
const galleryIdField = () =>
  check("galleryId")
    .notEmpty()
    .withMessage("The gallery is required")
    .isUUID()
    .withMessage("Invalid gallery ID")
    .custom(async (value) => {
      const gallery = await prisma.gallery.findUnique({
        where: { id: value },
      });

      if (!gallery) {
        throw new Error("Invalid gallery ID");
      }

      return true;
    });

const shippingAddressField = () =>
  check("shippingAddress")
    .optional()
    .isObject()
    .withMessage("shippingAddress must be an object");

const noteField = () =>
  check("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 500 })
    .withMessage("Too long note");

// Order id in the URL -> loads the order, attaches it to req.order
const orderIdField = param("id")
  .notEmpty()
  .withMessage("No order id provided")
  .isUUID()
  .withMessage("Invalid order ID")
  .custom(async (value, { req }) => {
    const order = await prisma.order.findUnique({
      where: { id: value },
      include: { items: true },
    });

    if (!order) {
      throw new Error("Invalid order ID");
    }

    req.order = order;
    return true;
  });

// Create order (checkout a gallery's items)
const createOrderValidator = [
  galleryIdField(),
  shippingAddressField(),
  noteField(),
  validatorMiddleware,
];

// Get one order
const getOrderValidator = [orderIdField, validatorMiddleware];

// Confirm an order (gallery owner/employee)
const confirmOrderValidator = [orderIdField, validatorMiddleware];

module.exports = {
  createOrderValidator,
  getOrderValidator,
  confirmOrderValidator,
};
