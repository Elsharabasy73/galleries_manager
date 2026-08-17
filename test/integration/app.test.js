const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");

const request = require("supertest");

const createApp = require("../../src/app");

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

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
