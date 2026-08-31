const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

require("../../../src/config/jsxLoader");
const { render } = require("@react-email/render");
const PasswordResetEmail =
  require("../../../src/shared/templates/emails/passwordResetEmail.jsx").default;

describe("passwordResetEmail template", () => {
  // React SSR separates adjacent text nodes with <!-- --> comments.
  const renderHtml = async (props) => {
    const html = await render(PasswordResetEmail(props));
    return html.replace(/<!--.*?-->/g, "");
  };

  it("renders the OTP, preview text, and banner image", async () => {
    const html = await renderHtml({
      otp: "123456",
      userName: "Sara",
      expiresInMinutes: 30,
      bannerUrl: "https://example.com/banner.jpg",
    });

    assert.ok(html.includes("123456"));
    assert.ok(html.includes("Your password reset code is 123456"));
    assert.ok(html.includes("Hi Sara,"));
    assert.ok(html.includes("expires in 30 minutes"));
    assert.ok(
      html.includes('src="https://example.com/banner.jpg"'),
      "banner image should be rendered when bannerUrl is provided",
    );
  });

  it("compiles Tailwind classes into inline styles", async () => {
    const html = await render(PasswordResetEmail({ otp: "654321" }));

    assert.match(
      html,
      /background-color:\s*(#f3f4f6|rgb\(243,\s*244,\s*246\))/i,
      "body background class should be inlined",
    );
    assert.match(
      html,
      /letter-spacing:\s*8px/i,
      "OTP letter spacing class should be inlined",
    );
  });

  it("omits the banner image when no bannerUrl is given", async () => {
    const html = await render(PasswordResetEmail({ otp: "111111" }));

    assert.ok(!html.includes("<img"), "no img tag should be rendered");
  });
});
