const asyncHandler = require("express-async-handler");

const adminService = require("./admin.service");

// @desc    Get image counts from filesystem and database for galleries, products, users
// @route   GET /api/v1/admin/images-stats
// @access  Private (admin)
const getImageStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getImageStats();

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

// @desc    Get orphan images: storage not in DB vs DB not in storage
// @route   GET /api/v1/admin/images-orphans
// @access  Private (admin)
const getImageOrphans = asyncHandler(async (req, res) => {
  const orphans = await adminService.getImageOrphans();

  res.status(200).json({
    status: "success",
    data: orphans,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.params.id, req.body);

  res.status(200).json({
    status: "success",
    data: user,
  });
});

module.exports = {
  getImageStats,
  getImageOrphans,
  updateUser
};
