require("../../config/jsxLoader");

const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { render } = require("@react-email/render");

const { getEnvironment } = require("../../config/env");
// .jsx templates use export default, so take .default off the module object.
const PasswordResetEmail =
  require("../templates/emails/passwordResetEmail.jsx").default;

// 1) Send email via Gmail/SMTP (Nodemailer)
const sendEmailWithGmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SENDER_HOST,
    port: process.env.SENDER_PORT,
    secure: process.env.SENDER_SECURE === "true",
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
  });

  const mailOpts = {
    from: `"ElShaRabasy APP" <${process.env.SENDER_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(mailOpts);
    console.log(`Email sent: ${info.response}`);
  } catch (error) {
    console.error(error);
    throw new Error(
      "An error occurred while trying to send the email via Gmail.",
      { cause: error },
    );
  }
};

// 2) Send email via Resend
const sendEmailWithResend = async (options) => {
  try {
    if (!options.otp) {
      throw new Error("A password reset OTP is required.");
    }

    const environment = getEnvironment();
    // Precedence: explicit option > EMAIL_BANNER_URL env > bundled banner
    // served from storage/emails/ via the app's /storage static route.
    const bannerUrl =
      options.bannerUrl ||
      process.env.EMAIL_BANNER_URL ||
      `${environment.appUrl}/storage/emails/banner.jpg`;

    const html = await render(
      PasswordResetEmail({
        otp: options.otp,
        expiresInMinutes: options.expiresInMinutes,
        userName: options.userName,
        bannerUrl,
      }),
    );
    const resend = new Resend(environment.resendApiKey);
    const { data, error } = await resend.emails.send({
      from: environment.resendFrom,
      to: options.email,
      subject: options.subject,
      html,
      text: `Your password reset code is ${options.otp}. It is valid for ${options.expiresInMinutes || 60} minutes.`,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`Email sent via Resend: ${data.id}`);
  } catch (error) {
    console.error(error);
    throw new Error(
      "An error occurred while trying to send the email via Resend.",
      { cause: error },
    );
  }
};

module.exports = { sendEmailWithGmail, sendEmailWithResend };
