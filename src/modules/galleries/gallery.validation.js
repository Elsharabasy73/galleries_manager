const { check } = require("express-validator");
const slugify = require("slugify");

const validatorMiddleware = require("../../middlewares/validation.middleware");

const createGalleryValidator = [
  check("name")
    .notEmpty()
    .withMessage("The name is required")
    .isLength({ min: 3 })
    .withMessage("Too short name")
    .isLength({ max: 60 })
    .withMessage("Too long name")
    .custom((val, { req }) => {
      req.body.slug = slugify(val, {
        lower: true,
        strict: true,
      });
      return true;
    }),

  check("description")
    .notEmpty()
    .withMessage("The description is required")
    .isLength({ min: 3 })
    .withMessage("Too short description")
    .isLength({ max: 255 })
    .withMessage("Too long description"),

  check("mapAddressUrl")
    .optional()
    .isURL()
    .withMessage("Invalid map address URL"),

  check("city")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short city")
    .isLength({ max: 60 })
    .withMessage("Too long city"),

  check("country")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short country")
    .isLength({ max: 60 })
    .withMessage("Too long country"),

  check("logo")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short logo")
    .isLength({ max: 255 })
    .withMessage("Too long logo"),

  check("banner")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short banner")
    .isLength({ max: 255 })
    .withMessage("Too long banner"),

  validatorMiddleware,
];
module.exports = { createGalleryValidator };
