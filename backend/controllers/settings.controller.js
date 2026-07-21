const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const settingsService = require('../services/settings.service');

const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id, req.user.role);
  res.status(200).json(new ApiResponse(200, settings, 'Settings retrieved successfully'));
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.user._id, req.user.role, req.body);
  res.status(200).json(new ApiResponse(200, settings, 'Settings updated successfully'));
});

const getSavedPlaces = asyncHandler(async (req, res) => {
  const places = await settingsService.listSavedPlaces(req.user._id, req.user.role);
  res.status(200).json(new ApiResponse(200, places, 'Saved places retrieved successfully'));
});

const createSavedPlace = asyncHandler(async (req, res) => {
  const place = await settingsService.createSavedPlace(req.user._id, req.user.role, req.body);
  res.status(201).json(new ApiResponse(201, place, 'Saved place created successfully'));
});

const deleteSavedPlace = asyncHandler(async (req, res) => {
  const deleted = await settingsService.deleteSavedPlace(req.user._id, req.user.role, req.params.id);
  res.status(200).json(new ApiResponse(200, deleted, 'Saved place deleted successfully'));
});

const getPaymentMethods = asyncHandler(async (req, res) => {
  const methods = await settingsService.listPaymentMethods(req.user._id, req.user.role);
  res.status(200).json(new ApiResponse(200, methods, 'Payment methods retrieved successfully'));
});

const addPaymentMethod = asyncHandler(async (req, res) => {
  const method = await settingsService.addPaymentMethod(req.user._id, req.user.role, req.body);
  res.status(201).json(new ApiResponse(201, method, 'Payment method saved successfully'));
});

const deletePaymentMethod = asyncHandler(async (req, res) => {
  const method = await settingsService.deletePaymentMethod(req.user._id, req.user.role, req.params.id);
  res.status(200).json(new ApiResponse(200, method, 'Payment method deleted successfully'));
});

const makeDefaultPaymentMethod = asyncHandler(async (req, res) => {
  const method = await settingsService.setDefaultPaymentMethod(req.user._id, req.user.role, req.params.id);
  res.status(200).json(new ApiResponse(200, method, 'Payment method set as default successfully'));
});

const getFaqs = asyncHandler(async (req, res) => {
  const faqs = await settingsService.getFaqs();
  res.status(200).json(new ApiResponse(200, faqs, 'FAQs retrieved successfully'));
});

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await settingsService.createTicket(req.user._id, req.user.role, req.body);
  res.status(201).json(new ApiResponse(201, ticket, 'Support ticket created successfully'));
});

module.exports = {
  getSettings,
  updateSettings,
  getSavedPlaces,
  createSavedPlace,
  deleteSavedPlace,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  makeDefaultPaymentMethod,
  getFaqs,
  createTicket,
};