const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");

const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const authenticate = require("../../../src/middlewares/auth.middleware");
const authorize = require("../../../src/middlewares/authorization.middleware");
const errorHandler = require("../../../src/middlewares/error.middleware");
const { ROLES } = require("../../../src/shared/constants/roles");

const ORIGINAL_ENVIRONMENT = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

const createTestApp = (allowedRoles = [ROLES.ADMIN]) => {
  const app = express();

  app.get("/protected", authenticate, authorize(allowedRoles), (req, res) =>
    res.status(200).json({ data: req.user }),
  );
  app.use(errorHandler);

  return app;
};

describe("authentication and authorization middleware", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
    process.env.JWT_SECRET = "test-secret-with-sufficient-length";
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(ORIGINAL_ENVIRONMENT)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it("rejects requests without a bearer token", async () => {
    const response = await request(createTestApp()).get("/protected");

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Authentication required");
  });

  it("rejects invalid bearer tokens", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", "Bearer invalid-token");

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Invalid authentication token");
  });

  it("attaches a principal for a valid authorized token", async () => {
    const token = jwt.sign({ role: ROLES.ADMIN }, process.env.JWT_SECRET, {
      subject: "user-id",
      expiresIn: "1h",
    });

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, {
      id: "user-id",
      role: ROLES.ADMIN,
    });
  });

  it("rejects authenticated users without an allowed role", async () => {
    const token = jwt.sign({ role: ROLES.USER }, process.env.JWT_SECRET, {
      subject: "user-id",
      expiresIn: "1h",
    });

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
    assert.equal(
      response.body.message,
      "You are not authorized for this action",
    );
  });
});
