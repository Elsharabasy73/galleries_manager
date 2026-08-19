const fs = require("fs/promises");
const path = require("path");

const STORAGE_TYPES = {
  GALLERIES: "galleries",
  PRODUCTS: "products",
  USERS: "users",
};

const getStorageFolderPath = (type, folderName) => {
  if (!Object.values(STORAGE_TYPES).includes(type)) {
    throw new Error(`Invalid storage type: ${type}`);
  }

  return path.join(
    process.cwd(),
    "storage",
    "uploads",
    type,
    folderName,
  );
};

// Delete the entire storage folder
const deleteStorageFolder = async (type, folderName) => {
  const folderPath = getStorageFolderPath(type, folderName);

  await fs.rm(folderPath, {
    recursive: true,
    force: true,
  });
};

// Delete one file from a storage folder
const deleteStorageFile = async (type, folderName, fileName) => {
  if (!fileName) return;

  const folderPath = getStorageFolderPath(type, folderName);
  const filePath = path.join(folderPath, fileName);

  await fs.rm(filePath, {
    force: true,
  });
};

// Delete multiple files from a storage folder
const deleteStorageFiles = async (type, folderName, fileNames = []) => {
  if (!fileNames.length) return;

  await Promise.all(
    fileNames.map((fileName) =>
      deleteStorageFile(type, folderName, fileName),
    ),
  );
};

module.exports = {
  STORAGE_TYPES,
  getStorageFolderPath,
  deleteStorageFolder,
  deleteStorageFile,
  deleteStorageFiles,
};