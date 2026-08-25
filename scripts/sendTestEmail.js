require("../src/config/jsxLoader");

const { sendEmailWithResend } = require("../src/shared/utils/sendEmail");

const recipient = process.argv[2];

if (!recipient) {
  console.error("Usage: npm run test:email -- recipient@example.com");
  process.exitCode = 1;
} else {
  sendEmailWithResend({
    email: recipient,
    subject: "Password reset email test",
    otp: "123456",
    expiresInMinutes: 60,
    userName: "Test user",
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
