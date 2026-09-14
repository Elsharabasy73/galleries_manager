const bcrypt = require("bcryptjs");
const slugify = require("slugify");

const { getPrisma } = require("../../config/prisma");
const ApiError = require("../../shared/utils/ApiError");
const { ROLES } = require("../../shared/constants/roles");
const { generateAuthToken } = require("../../shared/utils/jwt");

const updateMe = async (userId, data) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const allowedFields = ["firstName", "lastName", "phone", "avatar"];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });

  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No valid fields to update", 400);
  }

  if (updateData.firstName || updateData.lastName) {
    const firstName = updateData.firstName || user.firstName || "";
    const lastName = updateData.lastName || user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      updateData.slug = slugify(fullName, { lower: true, strict: true });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = updated;
  return safeUser;
};

const deleteMe = async (user) => {
  const prisma = getPrisma();

  if (user.role === ROLES.ADMIN) {
    throw new ApiError("Admin accounts cannot be deleted via this route", 403);
  }

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (!existing) {
    throw new ApiError("User not found", 404);
  }

  await prisma.user.delete({ where: { id: user.id } });
};

const deleteUser = async (targetId) => {
  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id: targetId } });

  if (!target) {
    throw new ApiError("User not found", 404);
  }

  await prisma.user.delete({ where: { id: targetId } });
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  const isCorrect = await bcrypt.compare(currentPassword, user.password);
  if (!isCorrect) {
    throw new ApiError("Current password is incorrect", 401);
  }

  if (currentPassword === newPassword) {
    throw new ApiError(
      "New password must be different from current password",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  const token = generateAuthToken({ userId: updated.id, role: updated.role });

  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = updated;
  return { user: safeUser, token };
};

const countUsers = async () => {
  const prisma = getPrisma();
  const count = await prisma.user.count();
  return count;
}

const updateUser = async (targetId, data) => {
  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new ApiError("User not found", 404);
  }
  const allowedFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "role",
    "isActive",
  ];
  const updateData = {};
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  });
  // also support combined name field from frontend
  if (data.name && !updateData.firstName && !updateData.lastName) {
    const parts = data.name.trim().split(/\s+/);
    updateData.firstName = parts[0];
    updateData.lastName = parts.slice(1).join(" ") || target.lastName;
  }
  if (updateData.role === "admin") {
    throw new ApiError("Cannot set role to admin", 403);
  }
  if (Object.keys(updateData).length === 0) {
    throw new ApiError("No valid fields to update", 400);
  }
  if (updateData.email) {
    const existing = await prisma.user.findUnique({ where: { email: updateData.email } });
    if (existing && existing.id !== targetId) {
      throw new ApiError("Email already in use", 400);
    }
  }
  if (updateData.firstName || updateData.lastName) {
    const firstName = updateData.firstName || target.firstName || "";
    const lastName = updateData.lastName || target.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) {
      updateData.slug = slugify(fullName, { lower: true, strict: true });
    }
  }
  const updated = await prisma.user.update({
    where: { id: targetId },
    data: updateData,
  });
  const { password, ...safeUser } = updated;
  return safeUser;
};

module.exports = {
  updateMe,
  deleteMe,
  deleteUser,
  updatePassword,
  countUsers,
  updateUser
};
