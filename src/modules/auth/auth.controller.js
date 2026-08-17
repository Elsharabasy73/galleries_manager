const asyncHandler = require("express-async-handler");

const authService = require("./auth.service");

exports.signup = asyncHandler(async (req, res) => {
  const { user, token } = await authService.signup(req.body);

  res.status(201).json({
    status: "success",
    data: user,
    token,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, token } = await authService.login(req.body);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = await authService.forgotPassword(req.body.email);

  res.status(200).json({
    status: "success",
    message: `Password reset code sent to ${email}`,
  });
});

exports.verifyResetPasswordOTP = asyncHandler(async (req, res) => {
  await authService.verifyResetPasswordOTP({
    email: req.body.email,
    otp: req.body.otp,
  });

  res.status(200).json({
    status: "success",
    message: "OTP verified successfully",
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { user, token } = await authService.resetPassword(req.body);

  res.status(200).json({
    status: "success",
    data: user,
    token,
  });
});
