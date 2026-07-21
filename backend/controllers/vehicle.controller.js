const vehicleService = require('../services/vehicle.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const addVehicle = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const vehicle = await vehicleService.addVehicle(employeeId, req.body);
  res.status(201).json(new ApiResponse(201, vehicle, 'Vehicle registered successfully'));
});

const getVehicles = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const vehicles = await vehicleService.getEmployeeVehicles(employeeId);
  res.status(200).json(new ApiResponse(200, vehicles, 'Vehicles retrieved successfully'));
});

const updateVehicle = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { id } = req.params;
  const vehicle = await vehicleService.updateVehicle(employeeId, id, req.body);
  res.status(200).json(new ApiResponse(200, vehicle, 'Vehicle details updated successfully'));
});

const deleteVehicle = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { id } = req.params;
  await vehicleService.deleteVehicle(employeeId, id);
  res.status(200).json(new ApiResponse(200, null, 'Vehicle deleted successfully'));
});

module.exports = {
  addVehicle,
  getVehicles,
  updateVehicle,
  deleteVehicle,
};
