const bcrypt = require("bcryptjs");
const { getPrisma } = require("../../config/prisma");

const generateOtp = require("../../shared/utils/generateOTP");
const sendEmail = require("../../shared/utils/sendEmail");
const ApiError = require("../../shared/utils/ApiError");
const { generateAuthToken } = require("../../shared/utils/jwt");

const prisma = getPrisma();

const signup = async ({ name, email, password, slug }) => {
  // Check if user already exists
  // console.log(prisma);
  // console.log(prisma.user);
  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new ApiError("Email already in use", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      firstName: name,
      lastName: name,
      email,
      password: hashedPassword,
      slug,
    },
  });

  // Generate JWT
  const token = generateAuthToken({ userId: user.id, role: user.role });

  return {
    user,
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("Invalid email or password", 401);
  }

  const passwordCorrect = await bcrypt.compare(password, user.password);

  if (!passwordCorrect) {
    throw new ApiError("Invalid email or password", 401);
  }

  const token = generateAuthToken({ userId: user.id, role: user.role });

  return {
    user,
    token,
  };
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const otp = generateOtp();

  const hashedOtp = await bcrypt.hash(otp, 12);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordResetCode: hashedOtp,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      passwordResetVerified: false,
    },
  });

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset code",
      message: `Your password reset code is ${otp}. It is valid for 1 hour.`,
    });
  } catch (error) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetCode: null,
        passwordResetExpires: null,
        passwordResetVerified: false,
      },
    });

    throw new ApiError("Error sending email", 500);
  }

  return user.email;
};

const verifyResetPasswordOTP = async ({ email, otp }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (!user.passwordResetCode) {
    throw new ApiError("No password reset code", 404);
  }

  if (!user.passwordResetExpires) {
    throw new ApiError("OTP expired", 401);
  }

  if (user.passwordResetExpires < new Date()) {
    throw new ApiError("OTP expired", 401);
  }

  const otpCorrect = await bcrypt.compare(otp, user.passwordResetCode);

  if (!otpCorrect) {
    throw new ApiError("Invalid OTP", 401);
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordResetVerified: true,
    },
  });
};

const resetPassword = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (!user.passwordResetVerified) {
    throw new ApiError("Password reset not verified", 401);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      passwordResetCode: null,
      passwordResetExpires: null,
      passwordResetVerified: false,
    },
  });

  const token = updatedUser.generateAuthToken(updatedUser.id);

  return {
    user: updatedUser,
    token,
  };
};

module.exports = {
  signup,
  login,
  forgotPassword,
  verifyResetPasswordOTP,
  resetPassword,
};
