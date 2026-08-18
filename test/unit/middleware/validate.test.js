const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const express = require("express");
const { body } = require("express-validator");
const request = require("supertest");

const errorHandler = require("../../../src/middlewares/error.middleware");
const validate = require("../../../src/middlewares/validation.middleware");

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.post(
    "/resource",
    body("name").isString().trim().notEmpty(),
    validate,
    (req, res) => res.status(200).json({ data: req.body }),
  );
  app.use(errorHandler);

  return app;
};

describe("validate middleware", () => {
  it("forwards normalized valid input", async () => {
    const response = await request(createTestApp())
      .post("/resource")
      .send({ name: "  Chair  " });

    assert.equal(response.status, 200);
    assert.equal(response.body.data.name, "Chair");
  });

  it("returns validation details for invalid input", async () => {
    const response = await request(createTestApp())
      .post("/resource")
      .send({ name: "" });

    assert.equal(response.status, 400);
    assert.equal(response.body.status, "fail");
    assert.equal(response.body.message, "Validation failed");
    assert.equal(Array.isArray(response.body.errors), true);
    assert.equal(response.body.errors[0].path, "name");
  });

  it("returns a useful message for duplicate Prisma records", async () => {
    const app = express();

    app.get("/duplicate", (req, res, next) => {
      const error = new Error("Unique constraint failed");
      error.name = "PrismaClientKnownRequestError";
      error.code = "P2002";
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app).get("/duplicate");

    assert.equal(response.status, 400);
    assert.equal(response.body.status, "fail");
    assert.equal(response.body.message, "A record with this value already exists.");
  });

  it("explains Prisma Client validation failures", async () => {
    const app = express();

    app.get("/prisma-client", (req, res, next) => {
      const error = new Error("Unknown argument `slug`");
      error.name = "PrismaClientValidationError";
      next(error);
    });
    app.use(errorHandler);

    const response = await request(app).get("/prisma-client");

    assert.equal(response.status, 500);
    assert.equal(
      response.body.message,
      "Database client is out of date. Regenerate Prisma Client and restart the server.",
    );
  });
});
