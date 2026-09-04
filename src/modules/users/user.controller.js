const asyncHandler = require("express-async-handler");
const userService = require("./user.service");
const { getPrisma } = require("../../config/prisma");
const factory = require("../../controllers/handleFactory");

const prisma = getPrisma();

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateMe(req.user.id, req.body);
  res.status(200).json({ status: "success", data: user });
});

exports.deleteMe = asyncHandler(async (req, res) => {
  await userService.deleteMe(req.user);
  res.status(204).send();
});

exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});

exports.updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { user, token } = await userService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword,
  );
  res.status(200).json({ status: "success", data: user, token });
});

exports.getUsers = factory.getAll(prisma.user);

exports.countUsers = asyncHandler(async (req, res) => {
  const count = await userService.countUsers();
  res.status(200).json({
    status: "success",
    data: {
      count,
    },
  });
});
