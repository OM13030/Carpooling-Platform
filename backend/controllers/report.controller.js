const reportsService = require('../services/reports.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getEmployeeSummary = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { from, to, vehicleId } = req.query;

  const summary = await reportsService.getEmployeeSummary(employeeId, from, to, vehicleId);
  res.status(200).json(new ApiResponse(200, summary, 'Employee report summary retrieved successfully'));
});

module.exports = {
  getEmployeeSummary,
};
