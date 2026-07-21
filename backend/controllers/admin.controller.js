const adminService = require('../services/admin.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getDashboardStats = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const stats = await adminService.getDashboardStats(orgId);
  res.status(200).json(new ApiResponse(200, stats, 'Dashboard statistics retrieved successfully'));
});

module.exports = {
  getDashboardStats,
};
