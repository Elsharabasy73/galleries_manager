const express = require("express");

const router = express.Router();

const {
  signup,
  login,
  forgotPassword,
  verifyResetPasswordOTP,
  resetPassword,
} = require("./auth.controller");

const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetPasswordOTPValidator,
  resetPasswordValidator,
} = require("./auth.validation");

router.post("/signup", signupValidator, signup);

router.post("/login", loginValidator, login);

router.post("/forgotPassword", forgotPasswordValidator, forgotPassword);

router.post(
  "/verifyResetPasswordOTP",
  verifyResetPasswordOTPValidator,
  verifyResetPasswordOTP,
);

router.post("/resetPassword", resetPasswordValidator, resetPassword);

module.exports = router;
