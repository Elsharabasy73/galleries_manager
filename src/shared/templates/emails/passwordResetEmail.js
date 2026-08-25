const React = require("react");

const e = React.createElement;

const PasswordResetEmail = ({
  otp,
  expiresInMinutes = 60,
  userName = "there",
  bannerUrl,
}) =>
  e(
    "html",
    { lang: "en" },
    e("head", null),
    e(
      "body",
      {
        style: {
          backgroundColor: "#f3f4f6",
          color: "#1f2937",
          fontFamily: "Arial, sans-serif",
          margin: "0",
          padding: "0",
        },
      },
      e(
        "div",
        {
          style: {
            color: "transparent",
            display: "none",
            height: "0",
            maxHeight: "0",
            maxWidth: "0",
            opacity: "0",
            overflow: "hidden",
          },
        },
        `Your password reset code is ${otp}`,
      ),
      e(
        "table",
        {
          border: "0",
          cellPadding: "0",
          cellSpacing: "0",
          role: "presentation",
          style: { width: "100%" },
        },
        e(
          "tbody",
          null,
          e(
            "tr",
            null,
            e(
              "td",
              { align: "center", style: { padding: "40px 16px" } },
              e(
                "table",
                {
                  border: "0",
                  cellPadding: "0",
                  cellSpacing: "0",
                  role: "presentation",
                  style: {
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    maxWidth: "480px",
                    width: "100%",
                  },
                },
                e(
                  "tbody",
                  null,
                  bannerUrl
                    ? e(
                        "tr",
                        null,
                        e(
                          "td",
                          { style: { padding: "32px 32px 0" } },
                          e("img", {
                            alt: "Egypts",
                            src: bannerUrl,
                            style: { display: "block", maxWidth: "120px" },
                            width: "120",
                          }),
                        ),
                      )
                    : null,
                  e(
                    "tr",
                    null,
                    e(
                      "td",
                      { style: { padding: "32px" } },
                      e(
                        "p",
                        {
                          style: {
                            fontSize: "16px",
                            lineHeight: "24px",
                            margin: "0 0 16px",
                          },
                        },
                        `Hi ${userName},`,
                      ),
                      e(
                        "p",
                        {
                          style: {
                            fontSize: "16px",
                            lineHeight: "24px",
                            margin: "0 0 24px",
                          },
                        },
                        `Use the code below to reset your password. This code expires in ${expiresInMinutes} minutes.`,
                      ),
                      e(
                        "div",
                        {
                          style: {
                            backgroundColor: "#f9fafb",
                            borderRadius: "6px",
                            fontSize: "32px",
                            fontWeight: "700",
                            letterSpacing: "8px",
                            padding: "16px",
                            textAlign: "center",
                          },
                        },
                        otp,
                      ),
                      e(
                        "p",
                        {
                          style: {
                            color: "#6b7280",
                            fontSize: "14px",
                            lineHeight: "20px",
                            margin: "24px 0 0",
                          },
                        },
                        "If you didn't request this, you can safely ignore this email. Your password won't be changed.",
                      ),
                      e(
                        "p",
                        {
                          style: {
                            color: "#9ca3af",
                            fontSize: "12px",
                            lineHeight: "20px",
                            margin: "32px 0 0",
                          },
                        },
                        "Egypts. This is an automated message, please don't reply directly to this email.",
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );

module.exports = PasswordResetEmail;
