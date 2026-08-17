const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  //1) create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SENDER_HOST,
    port: process.env.SENDER_PORT,
    secure: process.env.SENDER_SECURE,
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASSWORD,
    },
  });
  //2)define email options
  const mailopts = {
    from: `"ElShaRabasy APP" <${process.env.SENDER_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  //3) send email
  await transporter.sendMail(mailopts, (error, info) => {
    if (error) {
      throw new Error("an error occure while trying to send the OTP email.");
    } else {
      console.log(`Email sent: ${info.response}`);
    }
  });
};

module.exports = sendEmail;
