const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const authorize = require("../../middlewares/authorization.middleware");
const { ROLES } = require("../../shared/constants/roles");

const {
  updateMe,
  deleteMe,
  deleteUser,
  updatePassword,
  countUsers,
  getUsers,
} = require("./user.controller");

const {
  updateMeValidator,
  deleteUserValidator,
  updatePasswordValidator,
} = require("./user.validation");

// All routes require authentication
router.use(protect);

// Self-service: update own info (all roles)
router.put("/me", updateMeValidator, updateMe);

// Update own password: currentPassword + newPassword + passwordConfirm (all roles)
router.put("/me/password", updatePasswordValidator, updatePassword);

// Self-delete: all roles except admin (blocked in service)
router.delete("/me", deleteMe);

router.get("/count", allowTo([ROLES.ADMIN]), countUsers);

router.get("/", allowTo([ROLES.ADMIN]), getUsers);

// Admin-only: delete any user by id (must be after /me and /count to avoid collision)
router.delete(
  "/:id",
  authorize([ROLES.ADMIN]),
  deleteUserValidator,
  deleteUser,
);

module.exports = router;
