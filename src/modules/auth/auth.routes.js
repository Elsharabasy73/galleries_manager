const express = require("express");

const router = express.Router();

const {
  signup,
  login,
  sendVerificationOtp,
  verifyEmail,
  forgotPassword,
  verifyResetPasswordOTP,
  resetPassword,
} = require("./auth.controller");

const {
  signupValidator,
  loginValidator,
  sendVerificationOtpValidator,
  verifyEmailValidator,
  forgotPasswordValidator,
  verifyResetPasswordOTPValidator,
  resetPasswordValidator,
} = require("./auth.validation");

router.post("/signup", signupValidator, signup);

router.post(
  "/send-verification-otp",
  sendVerificationOtpValidator,
  sendVerificationOtp,
);

router.post("/verify-email", verifyEmailValidator, verifyEmail);

router.post("/login", loginValidator, login);

router.post("/forgot-password", forgotPasswordValidator, forgotPassword);

router.post(
  "/verify-reset-password-otp",
  verifyResetPasswordOTPValidator,
  verifyResetPasswordOTP,
);

router.post("/reset-password", resetPasswordValidator, resetPassword);

module.exports = router;
