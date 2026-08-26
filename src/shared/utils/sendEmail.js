const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { render } = require("@react-email/render");

const { getEnvironment } = require("../../config/env");
const { OTP_PURPOSE } = require("../../modules/auth/auth.constants");
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

const renderEmailTemplate = async (options, purpose) => {
  const emailContent = {
    otp: options.otp,
    expiresInMinutes: getEnvironment().codeExpiresIn,
    userName: options.userName,
  };

  let html;
  let text;

  switch (purpose) {
    case OTP_PURPOSE.password_reset:
      otpValidator(options.otp);

      html = await render(PasswordResetEmail(emailContent));

      text = `Your password reset code is ${options.otp}. It is valid for ${
        getEnvironment().codeExpiresIn || 60
      } minutes.`;

      break;

    case OTP_PURPOSE.email_verification:
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

const sendEmailWithGmail = async (options, purpose, emailTemplate) => {
  const { html, text } = emailTemplate;

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
};

const sendEmailWithResend = async (options, purpose, emailTemplate) => {
  const { html, text } = emailTemplate;

  // Send the email using Resend.
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM,
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
};

const providerSelector = () => {
  if (process.env.SENDER === "RESEND") {
    return sendEmailWithResend;
  }

  if (process.env.SENDER === "GMAIL") {
    return sendEmailWithGmail;
  }

  throw new Error(`Invalid email sender: ${process.env.SENDER}`);
};

const sendEmail = async (options, purpose) => {
  const emailTemplate = await renderEmailTemplate(options, purpose);

  const provider = providerSelector();

  return provider(options, purpose, emailTemplate);
};

module.exports = { sendEmail };
