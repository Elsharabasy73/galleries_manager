const express = require("express");

const router = express.Router();

const { protect, allowTo } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../shared/constants/roles");
const { track, getVisitors } = require("./analytics.controller");
const { trackValidator, visitorsValidator } = require("./analytics.validation");

// @route POST /api/v1/analytics/track
// Public — anonymous page-view beacon. No auth by design.
router.post("/track", trackValidator, track);

// @route GET /api/v1/analytics/visitors
// Admin-only traffic overview.
router.get(
  "/visitors",
  protect,
  allowTo([ROLES.ADMIN]),
  visitorsValidator,
  getVisitors,
);

module.exports = router;
