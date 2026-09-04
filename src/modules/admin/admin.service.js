const fs = require("fs/promises");
const path = require("path");

const { getPrisma } = require("../../config/prisma");
const { STORAGE_DIRS, IMAGE_EXTENSIONS } = require("./admin.constants");

const UPLOADS_ROOT = path.join(process.cwd(), "storage", "uploads");

const isImageFile = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
};

// Recursively count files under a directory.
// Returns { files, imageFiles, folders }
const countFilesRecursive = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    return { files: 0, imageFiles: 0, folders: 0 };
  }

  let files = 0;
  let imageFiles = 0;
  let folders = 0;

  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  // Count sub-directories at this level
  for (const entry of entries) {
    if (entry.isDirectory()) folders += 1;
  }

  const tasks = entries.map(async (entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const sub = await countFilesRecursive(fullPath);
      return sub;
    }

    if (entry.isFile()) {
      // Ignore .gitkeep and hidden dotfiles
      if (entry.name === ".gitkeep" || entry.name.startsWith(".")) {
        return { files: 0, imageFiles: 0, folders: 0 };
      }
      return {
        files: 1,
        imageFiles: isImageFile(entry.name) ? 1 : 0,
        folders: 0,
      };
    }

    return { files: 0, imageFiles: 0, folders: 0 };
  });

  const results = await Promise.all(tasks);

  for (const r of results) {
    files += r.files;
    imageFiles += r.imageFiles;
    folders += r.folders;
  }

  return { files, imageFiles, folders };
};

// Recursively list all image files under a directory, returned as relative
// paths like "galleries/<folder>/<file>" or "products/<folder>/<file>".
const listFilesRecursive = async (dirPath, prefix) => {
  try {
    await fs.access(dirPath);
  } catch {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".gitkeep" || entry.name.startsWith(".")) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nested = await listFilesRecursive(
        fullPath,
        `${prefix}/${entry.name}`,
      );
      files.push(...nested);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      files.push(`${prefix}/${entry.name}`);
    }
  }

  return files;
};

const getFilesystemCounts = async () => {
  const galleriesPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.GALLERIES);
  const productsPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.PRODUCTS);
  const usersPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.USERS);

  const [galleries, products, users] = await Promise.all([
    countFilesRecursive(galleriesPath),
    countFilesRecursive(productsPath),
    countFilesRecursive(usersPath),
  ]);

  return {
    galleries: {
      path: `storage/uploads/${STORAGE_DIRS.GALLERIES}`,
      totalFiles: galleries.files,
      imageFiles: galleries.imageFiles,
      folders: galleries.folders,
    },
    products: {
      path: `storage/uploads/${STORAGE_DIRS.PRODUCTS}`,
      totalFiles: products.files,
      imageFiles: products.imageFiles,
      folders: products.folders,
    },
    users: {
      path: `storage/uploads/${STORAGE_DIRS.USERS}`,
      totalFiles: users.files,
      imageFiles: users.imageFiles,
      folders: users.folders,
    },
    total: {
      totalFiles: galleries.files + products.files + users.files,
      imageFiles: galleries.imageFiles + products.imageFiles + users.imageFiles,
      folders: galleries.folders + products.folders + users.folders,
    },
  };
};

const getDatabaseCounts = async () => {
  const prisma = getPrisma();

  const [galleries, products, users] = await Promise.all([
    prisma.gallery.findMany({
      select: { banner: true, logo: true, images: true },
    }),
    prisma.product.findMany({
      select: { mainImageUrl: true, images: true },
    }),
    prisma.user.findMany({
      select: { avatar: true },
    }),
  ]);

  // Galleries: banner + logo + images[]
  let galleryBannerCount = 0;
  let galleryLogoCount = 0;
  let galleryImagesArrayCount = 0;

  for (const g of galleries) {
    if (g.banner) galleryBannerCount += 1;
    if (g.logo) galleryLogoCount += 1;
    if (Array.isArray(g.images)) galleryImagesArrayCount += g.images.length;
  }

  const galleryTotalDbImages =
    galleryBannerCount + galleryLogoCount + galleryImagesArrayCount;

  // Products: mainImageUrl + images[]
  let productMainImageCount = 0;
  let productImagesArrayCount = 0;

  for (const p of products) {
    if (p.mainImageUrl) productMainImageCount += 1;
    if (Array.isArray(p.images)) productImagesArrayCount += p.images.length;
  }

  const productTotalDbImages = productMainImageCount + productImagesArrayCount;

  // Users: avatar
  let userAvatarCount = 0;
  for (const u of users) {
    if (u.avatar) userAvatarCount += 1;
  }

  return {
    galleries: {
      banner: galleryBannerCount,
      logo: galleryLogoCount,
      imagesArray: galleryImagesArrayCount,
      total: galleryTotalDbImages,
      records: galleries.length,
    },
    products: {
      mainImageUrl: productMainImageCount,
      imagesArray: productImagesArrayCount,
      total: productTotalDbImages,
      records: products.length,
    },
    users: {
      avatar: userAvatarCount,
      total: userAvatarCount,
      records: users.length,
    },
    total: {
      total: galleryTotalDbImages + productTotalDbImages + userAvatarCount,
    },
  };
};

const getImageStats = async () => {
  const [filesystem, database] = await Promise.all([
    getFilesystemCounts(),
    getDatabaseCounts(),
  ]);

  return {
    filesystem,
    database,
    summary: {
      galleries: {
        dbImages: database.galleries.total,
        filesystemImages: filesystem.galleries.imageFiles,
        filesystemFiles: filesystem.galleries.totalFiles,
      },
      products: {
        dbImages: database.products.total,
        filesystemImages: filesystem.products.imageFiles,
        filesystemFiles: filesystem.products.totalFiles,
      },
      users: {
        dbImages: database.users.total,
        filesystemImages: filesystem.users.imageFiles,
        filesystemFiles: filesystem.users.totalFiles,
      },
      total: {
        dbImages: database.total.total,
        filesystemImages: filesystem.total.imageFiles,
        filesystemFiles: filesystem.total.totalFiles,
      },
    },
  };
};

// ── Orphan detection: which files are on disk but not in DB, and vice versa ──

const getFilesystemFileLists = async () => {
  const galleriesPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.GALLERIES);
  const productsPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.PRODUCTS);
  const usersPath = path.join(UPLOADS_ROOT, STORAGE_DIRS.USERS);

  const [galleries, products, users] = await Promise.all([
    listFilesRecursive(galleriesPath, STORAGE_DIRS.GALLERIES),
    listFilesRecursive(productsPath, STORAGE_DIRS.PRODUCTS),
    listFilesRecursive(usersPath, STORAGE_DIRS.USERS),
  ]);

  return { galleries, products, users };
};

const getDatabaseFileLists = async () => {
  const prisma = getPrisma();

  const [galleryRows, productRows, userRows] = await Promise.all([
    prisma.gallery.findMany({
      select: { storageFolder: true, banner: true, logo: true, images: true },
    }),
    prisma.product.findMany({
      select: { mainImageUrl: true, images: true },
    }),
    prisma.user.findMany({
      select: { avatar: true },
    }),
  ]);

  // Galleries: DB stores filenames only, need prefix with storageFolder
  const galleryFiles = [];
  for (const g of galleryRows) {
    if (!g.storageFolder) continue;
    if (g.banner)
      galleryFiles.push(
        `${STORAGE_DIRS.GALLERIES}/${g.storageFolder}/${g.banner}`,
      );
    if (g.logo)
      galleryFiles.push(
        `${STORAGE_DIRS.GALLERIES}/${g.storageFolder}/${g.logo}`,
      );
    if (Array.isArray(g.images)) {
      for (const img of g.images) {
        if (img)
          galleryFiles.push(
            `${STORAGE_DIRS.GALLERIES}/${g.storageFolder}/${img}`,
          );
      }
    }
  }

  // Products: DB already stores "folder/filename" relative to storage/uploads/products
  const productFiles = [];
  for (const p of productRows) {
    if (p.mainImageUrl)
      productFiles.push(`${STORAGE_DIRS.PRODUCTS}/${p.mainImageUrl}`);
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img) productFiles.push(`${STORAGE_DIRS.PRODUCTS}/${img}`);
      }
    }
  }
  // Deduplicate product files (mainImageUrl is often duplicated inside images[])
  const dedupedProductFiles = [...new Set(productFiles)];

  // Users: avatar is a single filename or URL; treat as "users/<avatar>" if relative
  const userFiles = [];
  for (const u of userRows) {
    if (!u.avatar) continue;
    // If avatar is an absolute URL or already prefixed, keep as-is; otherwise prefix
    if (
      u.avatar.startsWith("http") ||
      u.avatar.startsWith(`${STORAGE_DIRS.USERS}/`)
    ) {
      userFiles.push(u.avatar);
    } else {
      userFiles.push(`${STORAGE_DIRS.USERS}/${u.avatar}`);
    }
  }

  return {
    galleries: galleryFiles,
    products: dedupedProductFiles,
    users: userFiles,
  };
};

const getImageOrphans = async () => {
  const [fsLists, dbLists] = await Promise.all([
    getFilesystemFileLists(),
    getDatabaseFileLists(),
  ]);

  const diff = (fsArr, dbArr) => {
    const fsSet = new Set(fsArr);
    const dbSet = new Set(dbArr);
    const storageNotInDb = fsArr.filter((f) => !dbSet.has(f)).sort();
    const dbNotInStorage = dbArr.filter((f) => !fsSet.has(f)).sort();
    return { storageNotInDb, dbNotInStorage };
  };

  const galleries = diff(fsLists.galleries, dbLists.galleries);
  const products = diff(fsLists.products, dbLists.products);
  const users = diff(fsLists.users, dbLists.users);

  const allStorageNotInDb = [
    ...galleries.storageNotInDb,
    ...products.storageNotInDb,
    ...users.storageNotInDb,
  ].sort();
  const allDbNotInStorage = [
    ...galleries.dbNotInStorage,
    ...products.dbNotInStorage,
    ...users.dbNotInStorage,
  ].sort();

  return {
    galleries: {
      filesystemFiles: fsLists.galleries.sort(),
      dbFiles: dbLists.galleries.sort(),
      storageNotInDb: galleries.storageNotInDb,
      dbNotInStorage: galleries.dbNotInStorage,
      counts: {
        filesystem: fsLists.galleries.length,
        db: dbLists.galleries.length,
        storageNotInDb: galleries.storageNotInDb.length,
        dbNotInStorage: galleries.dbNotInStorage.length,
      },
    },
    products: {
      filesystemFiles: fsLists.products.sort(),
      dbFiles: dbLists.products.sort(),
      storageNotInDb: products.storageNotInDb,
      dbNotInStorage: products.dbNotInStorage,
      counts: {
        filesystem: fsLists.products.length,
        db: dbLists.products.length,
        storageNotInDb: products.storageNotInDb.length,
        dbNotInStorage: products.dbNotInStorage.length,
      },
    },
    users: {
      filesystemFiles: fsLists.users.sort(),
      dbFiles: dbLists.users.sort(),
      storageNotInDb: users.storageNotInDb,
      dbNotInStorage: users.dbNotInStorage,
      counts: {
        filesystem: fsLists.users.length,
        db: dbLists.users.length,
        storageNotInDb: users.storageNotInDb.length,
        dbNotInStorage: users.dbNotInStorage.length,
      },
    },
    summary: {
      storageNotInDb: allStorageNotInDb,
      dbNotInStorage: allDbNotInStorage,
      counts: {
        filesystemTotal:
          fsLists.galleries.length +
          fsLists.products.length +
          fsLists.users.length,
        dbTotal:
          dbLists.galleries.length +
          dbLists.products.length +
          dbLists.users.length,
        storageNotInDb: allStorageNotInDb.length,
        dbNotInStorage: allDbNotInStorage.length,
      },
    },
  };
};

const updateUser = async (userId, data) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError("User not found", 404);
  }
  if (data.role === ROLES.ADMIN) {
    throw new ApiError("Admin accounts cannot be updated via this route", 403);
  }
  const allowedFields = ["firstName", "lastName", "email", "phone", "role"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No valid fields to update", 400);
  }

  if (updateData.firstName || updateData.lastName) {
    const firstName = updateData.firstName || user.firstName || "";
    const lastName = updateData.lastName || user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      updateData.slug = slugify(fullName, { lower: true, strict: true });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
};

module.exports = {
  getImageStats,
  getFilesystemCounts,
  getDatabaseCounts,
  getImageOrphans,
  getFilesystemFileLists,
  getDatabaseFileLists,
  updateUser,
};
