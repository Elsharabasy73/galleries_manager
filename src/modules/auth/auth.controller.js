const asyncHandler = require("express-async-handler");

const authService = require("./auth.service");

exports.signup = asyncHandler(async (req, res) => {
  // Exclude confirmation from the persisted user data.
  // eslint-disable-next-line no-unused-vars
  const { passwordConfirm, ...userData } = req.body;
  const { user } = await authService.signup(userData);

  res.status(201).json({
    status: "success",
    data: user,
  });
});

exports.sendVerificationOtp = asyncHandler(async (req, res) => {
  const { email } = await authService.sendVerificationOtp(req.body.email);

  res.status(200).json({
    status: "success",
    message: `Verification code sent to ${email}`,
  });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
    data: user,
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

exports.getMe = asyncHandler(async (req, res) => {
  const { password, ...safeUser } = req.user;

  res.status(200).json({
    status: "success",
    data: safeUser,
  });
});
