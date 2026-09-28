const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");

const request = require("supertest");

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

// Set required environment variables before importing the app
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.RESEND_API_KEY = "test-resend-key";
process.env.RESEND_FROM = "test@example.com";
process.env.BREVO_API_KEY = "test-brevo-key";
process.env.BREVO_FROM = "test@example.com";
process.env.REDIS_URL = "redis://localhost:6379";

const createApp = require("../../src/app");

describe("application foundation", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  });

  it("returns health information", async () => {
    const response = await request(createApp()).get("/api/v1/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "success");
    assert.equal(response.body.data.service, "galleries-manager");
    assert.equal(typeof response.body.data.uptime, "number");
  });

  it("returns a centralized 404 response", async () => {
    const response = await request(createApp()).get("/api/v1/missing");

    assert.equal(response.status, 404);
    assert.equal(response.body.status, "fail");
    assert.match(response.body.message, /Route not found/);
  });
});
