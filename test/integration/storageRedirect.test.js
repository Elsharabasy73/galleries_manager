const assert = require("node:assert/strict");
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
