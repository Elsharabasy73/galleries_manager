const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");

const {
  deleteStorageFolder,
  getStorageFileUrl,
  getStorageFolderPath,
} = require("../../../src/shared/utils/storage/storage");
const {
  getStableImageFolder,
  processImage,
} = require("../../../src/shared/utils/storage/image.utils");

test("stable image folder prefers existing refs and falls back to the entity ID", () => {
  assert.equal(
    getStableImageFolder({
      id: "product-id",
      mainImageUrl: "old-name-uuid/main.webp",
      images: ["other-folder/extra.webp"],
    }),
    "old-name-uuid",
  );
  assert.equal(
    getStableImageFolder({
      id: "product-id",
      mainImageUrl: "https://images.example.com/main.webp",
      images: [],
    }),
    "product-id",
  );
  assert.equal(
    getStableImageFolder({
      id: "product-id",
      images: ["existing-folder/extra.webp"],
    }),
    "existing-folder",
  );
});

test("Sharp output is stored via the selected provider with stable image URLs", async () => {
  const originalCwd = process.cwd();
  const originalProvider = process.env.STORAGE_PROVIDER;
  const originalPublicUrl = process.env.R2_PUBLIC_URL;
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "gallery-image-storage-"),
  );

  try {
    process.chdir(temporaryDirectory);
    process.env.STORAGE_PROVIDER = "local";

    const inputBuffer = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: "#cc8844",
      },
    })
      .jpeg()
      .toBuffer();
    const fileName = await processImage({
      file: { buffer: inputBuffer },
      type: "galleries",
      folderName: "test-gallery",
      prefix: "logo",
      width: 32,
      height: 32,
    });
    const savedPath = path.join(
      getStorageFolderPath("galleries", "test-gallery"),
      fileName,
    );

    assert.match(fileName, /\.webp$/);
    assert.equal((await sharp(savedPath).metadata()).format, "webp");
    assert.equal(
      getStorageFileUrl("galleries", "test-gallery", fileName),
      `/storage/uploads/galleries/test-gallery/${fileName}`,
    );

    await assert.rejects(
      deleteStorageFolder("galleries", "../outside"),
      /Invalid storage folder/,
    );
    await deleteStorageFolder("galleries", "test-gallery");
    await assert.rejects(fs.access(savedPath), { code: "ENOENT" });

    process.env.STORAGE_PROVIDER = "r2";
    process.env.R2_PUBLIC_URL = "https://images.example.com/";
    assert.equal(
      getStorageFileUrl("galleries", "test-gallery", fileName),
      `https://images.example.com/uploads/galleries/test-gallery/${fileName}`,
    );
  } finally {
    process.chdir(originalCwd);
    if (originalProvider === undefined) {
      delete process.env.STORAGE_PROVIDER;
    } else {
      process.env.STORAGE_PROVIDER = originalProvider;
    }
    if (originalPublicUrl === undefined) {
      delete process.env.R2_PUBLIC_URL;
    } else {
      process.env.R2_PUBLIC_URL = originalPublicUrl;
    }
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});
