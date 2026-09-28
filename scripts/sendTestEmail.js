require("../src/config/jsxLoader");

const { sendEmail } = require("../src/shared/utils/sendEmail");
const { OTP_PURPOSE } = require("../src/modules/auth/auth.constants");

const recipient = process.argv[2];

if (!recipient) {
  console.error("Usage: npm run test:email -- recipient@example.com");
  process.exitCode = 1;
} else {
  sendEmail(
    {
      email: recipient,
      subject: "Password reset email test",
      otp: "123456",
      expiresInMinutes: 60,
      userName: "Test user",
    },
    OTP_PURPOSE.password_reset,
  ).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
