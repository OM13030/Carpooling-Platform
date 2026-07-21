const miscService = require('../services/misc.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getSavedPlaces = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const places = await miscService.getSavedPlaces(employeeId);
  res.status(200).json(new ApiResponse(200, places, 'Saved places retrieved successfully'));
});

const createSavedPlace = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const place = await miscService.createSavedPlace(employeeId, req.body);
  res.status(201).json(new ApiResponse(201, place, 'Place saved successfully'));
});

const deleteSavedPlace = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { id } = req.params;
  await miscService.deleteSavedPlace(employeeId, id);
  res.status(200).json(new ApiResponse(200, null, 'Saved place deleted successfully'));
});

const getNotifications = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await miscService.getNotifications(employeeId, page, limit);
  res.status(200).json(new ApiResponse(200, result, 'Notifications retrieved successfully'));
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  await miscService.markNotificationsRead(employeeId);
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

const rateParticipant = asyncHandler(async (req, res) => {
  const fromEmployeeId = req.user._id;
  const rating = await miscService.rateDriverOrPassenger(fromEmployeeId, req.body);
  res.status(201).json(new ApiResponse(201, rating, 'Rating submitted successfully'));
});

const getTripMessages = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { tripId } = req.params;
  const messages = await miscService.getTripMessages(tripId, employeeId);
  res.status(200).json(new ApiResponse(200, messages, 'Chat messages retrieved successfully'));
});

const sendTripMessage = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { tripId } = req.params;
  const { content } = req.body;
  const message = await miscService.createTripMessage(tripId, senderId, content);
  res.status(201).json(new ApiResponse(201, message, 'Message sent successfully'));
});

module.exports = {
  getSavedPlaces,
  createSavedPlace,
  deleteSavedPlace,
  getNotifications,
  markNotificationsRead,
  rateParticipant,
  getTripMessages,
  sendTripMessage,
};
