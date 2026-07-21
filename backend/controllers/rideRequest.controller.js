const rideRequestService = require('../services/rideRequest.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const createRequest = asyncHandler(async (req, res) => {
  const passengerId = req.user._id;
  const { rideId, seatsRequested, pickupPoint } = req.body;
  const request = await rideRequestService.createRequest(passengerId, rideId, seatsRequested, pickupPoint);
  res.status(201).json(new ApiResponse(201, request, 'Ride request sent successfully'));
});

const acceptRequest = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const { id } = req.params;
  const result = await rideRequestService.acceptRequest(driverId, id);
  res.status(200).json(new ApiResponse(200, result, 'Ride request accepted successfully'));
});

const rejectRequest = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const { id } = req.params;
  const request = await rideRequestService.rejectRequest(driverId, id);
  res.status(200).json(new ApiResponse(200, request, 'Ride request rejected successfully'));
});

const getRequestsForRide = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const { rideId } = req.params;
  const requests = await rideRequestService.getRideRequestsForRide(driverId, rideId);
  res.status(200).json(new ApiResponse(200, requests, 'Ride requests for ride retrieved successfully'));
});

const getMyRequests = asyncHandler(async (req, res) => {
  const passengerId = req.user._id;
  const requests = await rideRequestService.getMySentRequests(passengerId);
  res.status(200).json(new ApiResponse(200, requests, 'Your sent requests retrieved successfully'));
});

module.exports = {
  createRequest,
  acceptRequest,
  rejectRequest,
  getRequestsForRide,
  getMyRequests,
};
