const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const { getEnvironment } = require("../../config/env");

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
const getResendClient = () => new Resend(getEnvironment().resendApiKey);

const sendEmailWithResend = async (options) => {
  try {
    console.log("Sending email via Resend...");
    console.log(options);
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: getEnvironment().resendFrom,
      to: options.email,
      subject: options.subject,
      html: options.html || `<p>${options.message}</p>`,
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


