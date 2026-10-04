const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "******localhost:5432/test";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.RESEND_FROM = "test@example.com";
process.env.BREVO_API_KEY = "test-brevo-key";
process.env.BREVO_FROM = "test@example.com";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.STORAGE_PROVIDER = "r2";
process.env.R2_PUBLIC_URL = "https://images.example.com";

const createApp = require("../../src/app");

test("R2-backed local image paths redirect to the public object URL", async () => {
  const response = await request(createApp()).get(
    "/storage/uploads/galleries/demo/logo.webp",
  );

  assert.equal(response.status, 302);
  assert.equal(
    response.headers.location,
    "https://images.example.com/uploads/galleries/demo/logo.webp",
  );
});

test("R2 mode serves a matching local file before redirecting to R2", async () => {
  const localGalleryRoot = path.join(
    process.cwd(),
    "storage",
    "uploads",
    "galleries",
  );
  await fs.mkdir(localGalleryRoot, { recursive: true });
  const localFolder = await fs.mkdtemp(
    path.join(localGalleryRoot, "legacy-local-"),
  );
  const fileName = "legacy-image.txt";
  const contents = "this image has not been migrated to R2";

  try {
    await fs.writeFile(path.join(localFolder, fileName), contents);
    const response = await request(createApp()).get(
      `/storage/uploads/galleries/${path.basename(localFolder)}/${fileName}`,
    );

    assert.equal(response.status, 200);
    assert.equal(response.text, contents);
  } finally {
    await fs.rm(localFolder, { recursive: true, force: true });
  }
});
