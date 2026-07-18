const rideService = require('../services/ride.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const publishRide = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const orgId = req.user.organizationId;
  const ride = await rideService.publishRide(driverId, orgId, req.body);
  res.status(201).json(new ApiResponse(201, ride, 'Ride offered successfully'));
});

const searchRides = asyncHandler(async (req, res) => {
  const orgId = req.user.organizationId;
  const results = await rideService.searchRides(orgId, req.query);
  res.status(200).json(new ApiResponse(200, results, 'Available matching rides retrieved successfully'));
});

const getMyOfferedRides = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const rides = await rideService.getMyOfferedRides(driverId);
  res.status(200).json(new ApiResponse(200, rides, 'Your offered rides retrieved successfully'));
});

const getRideDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ride = await rideService.getRideDetails(id);
  res.status(200).json(new ApiResponse(200, ride, 'Ride details retrieved successfully'));
});

const triggerRecurringCheck = asyncHandler(async (req, res) => {
  const count = await rideService.expandRecurringRides();
  res.status(200).json(new ApiResponse(200, { count }, `Successfully processed template expansions. Materialized ${count} rides.`));
});

module.exports = {
  publishRide,
  searchRides,
  getMyOfferedRides,
  getRideDetails,
  triggerRecurringCheck,
};
