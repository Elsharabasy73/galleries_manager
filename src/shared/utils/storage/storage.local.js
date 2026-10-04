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

  const rootPath = path.resolve(process.cwd(), "storage", "uploads", type);
  const folderPath = path.resolve(rootPath, folderName);

  if (!folderPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Invalid storage folder");
  }

  return folderPath;
};

const saveStorageFile = async ({ type, folderName, fileName, buffer }) => {
  const folderPath = getStorageFolderPath(type, folderName);
  const filePath = path.resolve(folderPath, fileName);

  if (!filePath.startsWith(`${folderPath}${path.sep}`)) {
    throw new Error("Invalid storage file name");
  }

  await fs.mkdir(folderPath, { recursive: true });
  await fs.writeFile(filePath, buffer, { flag: "wx" });
};

const deleteStorageFolder = async (type, folderName) => {
  const folderPath = getStorageFolderPath(type, folderName);
  await fs.rm(folderPath, { recursive: true, force: true });
};

const deleteStorageFile = async (type, folderName, fileName) => {
  const folderPath = getStorageFolderPath(type, folderName);
  const filePath = path.resolve(folderPath, fileName);

  if (!filePath.startsWith(`${folderPath}${path.sep}`)) {
    throw new Error("Invalid storage file name");
  }

  await fs.rm(filePath, { force: true });
};

const deleteStorageKey = async (type, key) => {
  const segments = key.split("/");
  const fileName = segments.pop();

  if (!fileName || segments.length === 0) {
    throw new Error("Invalid storage key");
  }

  await deleteStorageFile(type, segments.join("/"), fileName);
};

const listStorageFiles = async (type) => {
  if (!Object.values(STORAGE_TYPES).includes(type)) {
    throw new Error(`Invalid storage type: ${type}`);
  }

  const rootPath = path.resolve(process.cwd(), "storage", "uploads", type);
  const files = [];

  const visit = async (directory, relativePath = "") => {
    let entries;
    try {
      entries = await fs.readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      if (entry.name === ".gitkeep" || entry.name.startsWith(".")) continue;

      const entryPath = path.posix.join(relativePath, entry.name);
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(fullPath, entryPath);
      } else if (entry.isFile()) {
        files.push(`${type}/${entryPath}`);
      }
    }
  };

  await visit(rootPath);
  return files;
};

module.exports = {
  STORAGE_TYPES,
  getStorageFolderPath,
  saveStorageFile,
  deleteStorageFolder,
  deleteStorageFile,
  deleteStorageKey,
  listStorageFiles,
};
