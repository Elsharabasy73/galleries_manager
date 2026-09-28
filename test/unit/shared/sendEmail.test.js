const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

require("../../../src/config/jsxLoader");
const sendEmailModule = require("../../../src/shared/utils/sendEmail");

describe("sendEmail module", () => {
  it("only exposes sendEmail", () => {
    assert.deepEqual(Object.keys(sendEmailModule), ["sendEmail"]);
    assert.equal(typeof sendEmailModule.sendEmail, "function");
  });
});
