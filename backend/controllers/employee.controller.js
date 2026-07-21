const employeeService = require('../services/employee.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getProfile = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const profile = await employeeService.getProfile(employeeId);
  res.status(200).json(new ApiResponse(200, profile, 'Profile retrieved successfully'));
});

const updateProfile = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const profile = await employeeService.updateProfile(employeeId, req.body);
  res.status(200).json(new ApiResponse(200, profile, 'Profile updated successfully'));
});

module.exports = {
  getProfile,
  updateProfile,
};
