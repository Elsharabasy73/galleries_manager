const multer = require("multer");
const ApiError = require("../shared/utils/ApiError");

const multerOptions = () => {
  const multerStorage = multer.memoryStorage();
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

  const multerFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new ApiError("Only Images allowed", 400), false);
    }
  };

  const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 11 },
  });

  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) =>
  multerOptions().fields(arrayOfFields);
