const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const ApiFeatures = require("../../../src/shared/utils/apiFeatures");

describe("ApiFeatures", () => {
  it("parses comma-separated in filters as a list", () => {
    const features = new ApiFeatures(
      {},
      { categoryId: { in: "category-a,category-b" } },
    );

    features.filter();

    assert.deepEqual(features.query.where, {
      categoryId: { in: ["category-a", "category-b"] },
    });
  });
});
