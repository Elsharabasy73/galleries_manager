const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");
const { getImageStats, getImageOrphans, updateUser } = require("./admin.controller");
const {
  getImageStatsValidator,
  getImageOrphansValidator,
} = require("./admin.validation");

// All admin routes require admin role
router.use(protect, allowTo([ROLES.ADMIN]));

// @route GET /api/v1/admin/images-stats
// Returns filesystem file counts + DB image counts for galleries, products, users
router.get("/images-stats", getImageStatsValidator, getImageStats);

// @route GET /api/v1/admin/images-orphans
// Returns which images are on storage but not in DB vs in DB but missing from storage
router.get("/images-orphans", getImageOrphansValidator, getImageOrphans);

router.patch("/users/:id", updateUser);

module.exports = router;
