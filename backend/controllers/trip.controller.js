const tripService = require('../services/trip.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await tripService.getTrip(id);
  res.status(200).json(new ApiResponse(200, result, 'Trip details retrieved successfully'));
});

const startTrip = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const { id } = req.params;
  const trip = await tripService.startTrip(driverId, id);
  res.status(200).json(new ApiResponse(200, trip, 'Trip started successfully'));
});

const completeTrip = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const { id } = req.params;
  const result = await tripService.completeTrip(driverId, id);
  res.status(200).json(new ApiResponse(200, result, 'Trip completed and settled successfully'));
});

const payPendingFare = asyncHandler(async (req, res) => {
  const passengerId = req.user._id;
  const { id } = req.params;
  const result = await tripService.payPendingFare(passengerId, id);
  res.status(200).json(new ApiResponse(200, result, 'Fare paid successfully'));
});

const getActiveTrip = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const trip = await tripService.getActiveTrip(employeeId);
  res.status(200).json(new ApiResponse(200, trip, 'Active trip retrieved successfully'));
});

const getTripHistory = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const history = await tripService.getTripHistory(employeeId);
  res.status(200).json(new ApiResponse(200, history, 'Trip history retrieved successfully'));
});

module.exports = {
  getTrip,
  startTrip,
  completeTrip,
  payPendingFare,
  getActiveTrip,
  getTripHistory,
};
