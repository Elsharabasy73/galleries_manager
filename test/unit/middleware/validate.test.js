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
});
