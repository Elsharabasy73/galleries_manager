const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");

const express = require("express");
const jwt = require("jsonwebtoken");
const request = require("supertest");

const { protect, allowTo } = require("../../../src/middlewares/auth.middleware");
const errorHandler = require("../../../src/middlewares/error.middleware");
const { ROLES } = require("../../../src/shared/constants/roles");

const ORIGINAL_ENVIRONMENT = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

// Mock user database
const mockUsers = new Map();

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: async ({ where: { id } }) => mockUsers.get(id) || null,
  },
};

const createTestApp = (allowedRoles = [ROLES.ADMIN]) => {
  const app = express();

  app.get("/protected", protect(mockPrisma), allowTo(allowedRoles), (req, res) =>
    res.status(200).json({ data: req.user }),
  );
  app.use(errorHandler);

  return app;
};

describe("authentication and authorization middleware", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://localhost:5432/test";
    process.env.JWT_SECRET = "test-secret-with-sufficient-length";
    mockUsers.clear();
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
    assert.equal(response.body.message, "No token provided");
  });

  it("rejects invalid bearer tokens", async () => {
    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", "Bearer invalid-token");

    assert.equal(response.status, 401);
    assert.equal(response.body.message, "Invalid token");
  });

  it("attaches a principal for a valid authorized token", async () => {
    // Add mock user to the database
    mockUsers.set("user-id", {
      id: "user-id",
      role: ROLES.ADMIN,
      isActive: true,
      passwordChangedAt: null,
    });

    const token = jwt.sign({ userId: "user-id" }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, {
      id: "user-id",
      role: ROLES.ADMIN,
      isActive: true,
      passwordChangedAt: null,
    });
  });

  it("rejects authenticated users without an allowed role", async () => {
    // Add mock user to the database
    mockUsers.set("user-id", {
      id: "user-id",
      role: ROLES.USER,
      isActive: true,
      passwordChangedAt: null,
    });

    const token = jwt.sign({ userId: "user-id" }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const response = await request(createTestApp())
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    assert.equal(response.status, 403);
    assert.equal(
      response.body.message,
      "You are not authorized to do this",
    );
  });
});
