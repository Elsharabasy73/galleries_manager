const localStorage = require("./storage.local");
const r2Storage = require("./r2.storage");

const STORAGE_PROVIDER = {
  LOCAL: "local",
  R2: "r2",
};

const getStorageProvider = () => {
  const provider = (process.env.STORAGE_PROVIDER || STORAGE_PROVIDER.LOCAL)
    .trim()
    .toLowerCase();

  if (provider === STORAGE_PROVIDER.LOCAL) return STORAGE_PROVIDER.LOCAL;
  if (provider === STORAGE_PROVIDER.R2) return STORAGE_PROVIDER.R2;

  throw new Error(
    `Invalid STORAGE_PROVIDER: ${provider}. Expected "local" or "r2".`,
  );
};

const getStorage = () =>
  getStorageProvider() === STORAGE_PROVIDER.R2 ? r2Storage : localStorage;

const validateStoragePath = (value, label, allowNested = false) => {
  if (typeof value !== "string" || !value) {
    throw new Error(`Invalid storage ${label}`);
  }

  const segments = allowNested ? value.split("/") : [value];

  if (
    (!allowNested && value.includes("/")) ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("\\"),
    )
  ) {
    throw new Error(`Invalid storage ${label}`);
  }
};

const validateType = (type) => {
  if (!Object.values(localStorage.STORAGE_TYPES).includes(type)) {
    throw new Error(`Invalid storage type: ${type}`);
  }
};

const saveStorageFile = async (file) => {
  validateType(file.type);
  validateStoragePath(file.folderName, "folder");
  validateStoragePath(file.fileName, "file name");
  return getStorage().saveStorageFile(file);
};

const deleteStorageFolder = async (type, folderName) => {
  validateType(type);
  validateStoragePath(folderName, "folder");
  return getStorage().deleteStorageFolder(type, folderName);
};

const deleteStorageFile = async (type, folderName, fileName) => {
  validateType(type);
  validateStoragePath(folderName, "folder");
  validateStoragePath(fileName, "file name");
  return getStorage().deleteStorageFile(type, folderName, fileName);
};

const deleteStorageFiles = async (type, folderName, fileNames = []) =>
  Promise.all(
    fileNames.map((fileName) => deleteStorageFile(type, folderName, fileName)),
  );

const deleteStorageKey = async (type, key) => {
  validateType(type);
  validateStoragePath(key, "key", true);
  return getStorage().deleteStorageKey(type, key);
};

const listStorageFiles = async (type) => {
  validateType(type);
  return getStorage().listStorageFiles(type);
};

const getStorageFileUrl = (type, folderName, fileName) => {
  validateType(type);
  validateStoragePath(folderName, "folder");
  validateStoragePath(fileName, "file name");

  if (getStorageProvider() === STORAGE_PROVIDER.R2) {
    return r2Storage.getStorageFileUrl(type, folderName, fileName);
  }

  return `/storage/uploads/${[type, folderName, fileName]
    .map(encodeURIComponent)
    .join("/")}`;
};

module.exports = {
  STORAGE_TYPES: localStorage.STORAGE_TYPES,
  STORAGE_PROVIDER,
  getStorageProvider,
  getStorageFolderPath: localStorage.getStorageFolderPath,
  saveStorageFile,
  deleteStorageFolder,
  deleteStorageFile,
  deleteStorageFiles,
  deleteStorageKey,
  listStorageFiles,
  getStorageFileUrl,
};
