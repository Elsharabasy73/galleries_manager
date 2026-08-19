const { check, param } = require("express-validator");
const slugify = require("slugify");

const validatorMiddleware = require("../../middlewares/validation.middleware");

// Reusable fields
const nameValidator = check("name")
  .notEmpty()
  .withMessage("The name is required")
  .isLength({ min: 3 })
  .withMessage("Too short name")
  .isLength({ max: 60 })
  .withMessage("Too long name")
  .custom((value, { req }) => {
    req.body.slug = slugify(value, {
      lower: true,
      strict: true,
    });

    return true;
  });

const descriptionValidator = check("description")
  .notEmpty()
  .withMessage("The description is required")
  .isLength({ min: 3 })
  .withMessage("Too short description")
  .isLength({ max: 255 })
  .withMessage("Too long description");

const mapAddressUrlValidator = check("mapAddressUrl")
  .optional()
  .isURL()
  .withMessage("Invalid map address URL");

const cityValidator = check("city")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Too short city")
  .isLength({ max: 60 })
  .withMessage("Too long city");

const countryValidator = check("country")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Too short country")
  .isLength({ max: 60 })
  .withMessage("Too long country");

const logoValidator = check("logo")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Too short logo")
  .isLength({ max: 255 })
  .withMessage("Too long logo");

const bannerValidator = check("banner")
  .optional()
  .isLength({ min: 3 })
  .withMessage("Too short banner")
  .isLength({ max: 255 })
  .withMessage("Too long banner");

// Reusable gallery fields
const galleryFieldsValidators = [
  nameValidator,
  descriptionValidator,
  mapAddressUrlValidator,
  cityValidator,
  countryValidator,
  logoValidator,
  bannerValidator,
];

// Reusable ID validator
const galleryIdValidator = param("id")
  .notEmpty()
  .withMessage("No id provided")
  .isUUID()
  .withMessage("Invalid gallery ID");

// Create
const createGalleryValidator = [
  ...galleryFieldsValidators,
  validatorMiddleware,
];

// Get one
const getGalleryValidator = [
  galleryIdValidator,
  validatorMiddleware,
];

// Update
const updateGalleryValidator = [
  galleryIdValidator,
  ...galleryFieldsValidators,
  validatorMiddleware,
];

// Delete
const deleteGalleryValidator = [
  galleryIdValidator,
  validatorMiddleware,
];

module.exports = {
  createGalleryValidator,
  getGalleryValidator,
  updateGalleryValidator,
  deleteGalleryValidator,
};