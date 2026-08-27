const bcrypt = require("bcryptjs");

const { getPrisma } = require("../../config/prisma");
const ApiError = require("../../shared/utils/ApiError");
const { generateAuthToken } = require("../../shared/utils/jwt");
const { EMAIL_SUBJECTS, OTP_PURPOSE } = require("./auth.constants");
const { sendEmail } = require("../../shared/utils/sendEmail");
const generateOtp = require("../../shared/utils/generateOTP");
const {
  requestVerificationOtp,
  verifyVerificationOtp,
} = require("./otp.service");

const signup = async (userData) => {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    throw new ApiError("Email already in use", 400);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  userData.password = hashedPassword;

  const user = await prisma.user.create({
    data: {
      ...userData,
    },
  });

  // Auto-send verification OTP via Redis (300s TTL, 60s cooldown) immediately after creation
  const otp = await requestVerificationOtp(user.id);

  try {
    await sendEmail(
      {
        email: user.email,
        subject: EMAIL_SUBJECTS.email_verification,
        otp,
        userName: user.firstName,
      },
      "email_verification",
    );
  } catch {
    // Keep OTP in Redis for retry via /send-verification-otp; surface clear error
    throw new ApiError(
      "User created but failed to send verification email. Please request a new code via POST /api/v1/auth/send-verification-otp",
      500,
    );
  }

  return {
    user,
  };
};

const sendVerificationOtp = async (email) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.isActive) {
    throw new ApiError("Email already verified", 400);
  }

  const otp = await requestVerificationOtp(user.id);

  await sendEmail(
    {
      email: user.email,
      subject: EMAIL_SUBJECTS.email_verification,
      otp,
      userName: user.firstName,
    },
    "email_verification",
  );

  return { email: user.email };
};

const verifyEmail = async ({ email, otp }) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (user.isActive) {
    throw new ApiError("Email already verified", 400);
  }

  await verifyVerificationOtp(user.id, otp);

  const updated = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isActive: true,
    },
  });

  return updated;
};

const login = async ({ email, password }) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("Invalid email or password.", 401);
  }

  if (user.isActive === false) {
    throw new ApiError(
      "Please verify your email before logging in. Check your inbox or request a new code via POST /api/v1/auth/send-verification-otp",
      403,
    );
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
  const prisma = getPrisma();
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
    await sendEmail(
      {
        email: user.email,
        subject: EMAIL_SUBJECTS.password_reset,
        otp,
        userName: user.firstName,
      },
      OTP_PURPOSE.password_reset,
    );
  } catch {
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
  const prisma = getPrisma();
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
  const prisma = getPrisma();
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

  const token = generateAuthToken({
    userId: updatedUser.id,
    role: updatedUser.role,
  });

  return {
    user: updatedUser,
    token,
  };
};

module.exports = {
  signup,
  sendVerificationOtp,
  verifyEmail,
  login,
  forgotPassword,
  verifyResetPasswordOTP,
  resetPassword,
};
