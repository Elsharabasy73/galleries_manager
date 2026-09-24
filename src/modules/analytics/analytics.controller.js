const asyncHandler = require("express-async-handler");

const analyticsService = require("./analytics.service");

// @desc    Record one anonymous page view (UUID-based, no personal data)
// @route   POST /api/v1/analytics/track
// @access  Public — always 204, tracking never fails the request
const track = asyncHandler(async (req, res) => {
  try {
    await analyticsService.trackPageView({
      visitorId: req.body.visitorId,
      sessionId: req.body.sessionId,
      userId: req.body.userId,
      path: req.body.path,
      referrer: req.body.referrer,
      userAgent: req.headers["user-agent"],
    });
  } catch {
    // ignore — a tracking failure must never surface to the visitor
  }
  res.status(204).end();
});

// @desc    Site-traffic overview for admins (visitors, visits, page views, series, top pages)
// @route   GET /api/v1/analytics/visitors?from&to&groupBy=day|week|month
// @access  Private (admin)
const getVisitors = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getVisitorStats({
    from: req.query.from,
    to: req.query.to,
    groupBy: req.query.groupBy,
  });

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

module.exports = {
  track,
  getVisitors,
};
