const bcrypt = require("bcryptjs");
const { getPrisma } = require("../../config/prisma");

const generateOtp = require("../../shared/utils/generateOTP");
const ApiError = require("../../shared/utils/ApiError");
const { generateAuthToken } = require("../../shared/utils/jwt");
const generateOTP = require("../../shared/utils/generateOTP");
const { OTP_PURPOSE, EMAIL_SUBJECTS } = require("./auth.constants");
const { sendEmail } = require("../../shared/utils/sendEmail");
const { getEnvironment } = require("../../config/env");

const prisma = getPrisma();

const signup = async (userData) => {
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

  //generate otp
  const otp = generateOTP();
  //save user
  const user = await prisma.user.create({
    data: {
      ...userData,
    },
  });

  //save otp
  await prisma.otp.create({
    data: {
      userId: user.id,
      code: otp,
      purpose: OTP_PURPOSE.email_verification,
      expiresAt: new Date(
        Date.now() + getEnvironment().codeExpiresIn * 60 * 1000,
      ), //1 hour
    },
  });
  try {
    //send email
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
    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
        purpose: OTP_PURPOSE.email_verification,
      },
    });
    throw new ApiError("Error sending email", 500);
  }
  return {
    user,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError("Invalid email or password.", 401);
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
    await sendEmailWithResend({
      email: user.email,
      subject: EMAIL_SUBJECTS.password_reset,
      otp,
      expiresInMinutes: 60,
      userName: user.firstName,
    });
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
  login,
  forgotPassword,
  verifyResetPasswordOTP,
  resetPassword,
};
