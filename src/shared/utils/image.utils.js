const sharp = require("sharp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const {
  deleteStorageFile,
  deleteStorageFiles,
  STORAGE_TYPES,
} = require("./storage.utils");

// Generate a filesystem-safe date
const getFileDate = () => new Date().toISOString().replace(/[:.]/g, "-");

// Process and save a single image
const processImage = async ({
  file,
  folderPath,
  prefix,
  width = 500,
  height = 1000,
  options = {},
}) => {
  const date = getFileDate();

  const fileName = `${prefix}-${date}-${uuidv4()}.jpeg`;

  await sharp(file.buffer)
    .resize(width, height, options)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(path.join(folderPath, fileName));

  return fileName;
};

// Process multiple images
const processImages = async ({
  files,
  folderPath,
  prefix = "image",
  width = 500,
  height = 1000,
  options = {},
}) => {
  return Promise.all(
    files.map((file, index) =>
      processImage({
        file,
        folderPath,
        prefix: `${prefix}-number-${index + 1}`,
        width,
        height,
        options,
      }),
    ),
  );
};

// Replace one existing image with a new image
const replaceImage = async ({
  file,
  folderPath,
  storageFolder,
  oldFileName,
  prefix,
  width = 500,
  height = 1000,
  options = {},
}) => {
  // First create the new image
  const newFileName = await processImage({
    file,
    folderPath,
    prefix,
    width,
    height,
    options,
  });

  // Then delete the old image
  if (oldFileName) {
    await deleteStorageFile(
      STORAGE_TYPES.GALLERIES,
      storageFolder,
      oldFileName,
    );
  }

  return newFileName;
};

// Replace multiple existing images
const replaceImages = async ({
  files,
  folderPath,
  storageFolder,
  oldFileNames = [],
  prefix = "image",
  width = 500,
  height = 1000,
  options = {},
}) => {
  // Create new images
  const newFileNames = await processImages({
    files,
    folderPath,
    prefix,
    width,
    height,
    options,
  });

  // Delete old images
  if (oldFileNames.length) {
    await deleteStorageFiles(
      STORAGE_TYPES.GALLERIES,
      storageFolder,
      oldFileNames,
    );
  }

  return newFileNames;
};

module.exports = {
  processImage,
  processImages,
  replaceImage,
  replaceImages,
};
