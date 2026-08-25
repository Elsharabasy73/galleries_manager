require("../../config/jsxLoader");

const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { render } = require("@react-email/render");

const { getEnvironment } = require("../../config/env");
// .jsx templates use export default, so take .default off the module object.
const PasswordResetEmail =
  require("../templates/emails/passwordResetEmail.jsx").default;

const signupverificationEmail =
  require("../templates/emails/emailVerificationEmail.jsx").default;

const otpValidator = (otp) => {
  if (!otp) {
    throw new Error("OTP is required");
  }

  if (otp.length !== 6) {
    throw new Error("OTP must be 6 digits");
  }
};

const renderEmail = async (options, purpose) => {
  const emailContent = {
    otp: options.otp,
    expiresInMinutes: getEnvironment().codeExpiresIn,
    userName: options.userName,
  };

  let html;
  let text;

  switch (purpose) {
    case "password_reset":
      otpValidator(options.otp);

      html = await render(PasswordResetEmail(emailContent));

      text = `Your password reset code is ${options.otp}. It is valid for ${
        getEnvironment().codeExpiresIn || 60
      } minutes.`;

      break;

    case "email_verification":
      otpValidator(options.otp);

      html = await render(signupverificationEmail(emailContent));

      text = `Your email verification code is ${options.otp}. It is valid for ${
        options.expiresInMinutes || 60
      } minutes.`;

      break;

    default:
      throw new Error(`Invalid email purpose: ${purpose}`);
  }

  return { html, text };
};
// 1) Send email via Gmail/SMTP (Nodemailer)
const sendEmailWithGmail = async (options, purpose) => {
  try {
    const { html, text } = await renderEmail(options, purpose);

    const transporter = nodemailer.createTransport({
      host: process.env.SENDER_HOST,
      port: process.env.SENDER_PORT,
      secure: process.env.SENDER_SECURE === "true",
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"ElShaRabasy APP" <${process.env.SENDER_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent via Gmail: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error(error);

    throw new Error(
      "An error occurred while trying to send the email via Gmail.",
      { cause: error },
    );
  }
};

// 2) Send email via Resend
const sendEmailWithResend = async (options, purpose) => {
  try {
    const environment = getEnvironment();
    const { html, text } = await renderEmail(options, purpose);

    // Send the email using Resend.
    const resend = new Resend(environment.resendApiKey);
    const { data, error } = await resend.emails.send({
      from: environment.resendFrom,
      to: options.email,
      subject: options.subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`Email sent via Resend: ${data.id}`);
    return data;
  } catch (error) {
    console.error(error);
    throw new Error(
      "An error occurred while trying to send the email via Resend.",
      { cause: error },
    );
  }
};

const sendEmail = async (options, purpose) => {
  const providers = {
    RESEND: sendEmailWithResend,
    GMAIL: sendEmailWithGmail,
  };

  const provider = providers[process.env.SENDER];

  if (!provider) {
    throw new Error(`Invalid email sender: ${process.env.SENDER}`);
  }

  return provider(options, purpose);
};

module.exports = { sendEmail };
