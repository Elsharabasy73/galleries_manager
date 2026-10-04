const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

const {
  deleteStorageFiles,
  saveStorageFile,
  STORAGE_TYPES,
} = require("./storage");

const getFileDate = () => new Date().toISOString().replace(/[:.]/g, "-");

const getStableImageFolder = ({ id, mainImageUrl, images = [] }) => {
  for (const imageRef of [mainImageUrl, ...images]) {
    if (typeof imageRef !== "string" || /^https?:\/\//i.test(imageRef)) {
      continue;
    }

    const [folderName, fileName, ...extraSegments] = imageRef.split("/");
    if (
      folderName &&
      fileName &&
      extraSegments.length === 0 &&
      folderName !== "." &&
      folderName !== ".." &&
      !folderName.includes("\\")
    ) {
      return folderName;
    }
  }

  if (typeof id !== "string" || !id) {
    throw new Error("A stable image folder requires an entity ID");
  }

  return id;
};

const processImage = async ({
  file,
  type = STORAGE_TYPES.GALLERIES,
  folderName,
  prefix,
  width = 500,
  height = 1000,
  options = {},
}) => {
  const fileName = `${prefix}-${getFileDate()}-${uuidv4()}.webp`;
  const buffer = await sharp(file.buffer)
    .resize(width, height, options)
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  await saveStorageFile({
    type,
    folderName,
    fileName,
    buffer,
    contentType: "image/webp",
  });

  return fileName;
};

const processImages = async ({
  files,
  type = STORAGE_TYPES.GALLERIES,
  folderName,
  prefix = "image",
  width = 500,
  height = 1000,
  options = {},
}) => {
  const results = await Promise.allSettled(
    files.map((file, index) =>
      processImage({
        file,
        type,
        folderName,
        prefix: `${prefix}-number-${index + 1}`,
        width,
        height,
        options,
      }),
    ),
  );

  const createdFiles = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
  const failure = results.find((result) => result.status === "rejected");

  if (failure) {
    if (createdFiles.length) {
      await deleteStorageFiles(type, folderName, createdFiles);
    }
    throw failure.reason;
  }

  return results.map((result) => result.value);
};

module.exports = {
  getStableImageFolder,
  processImage,
  processImages,
};
