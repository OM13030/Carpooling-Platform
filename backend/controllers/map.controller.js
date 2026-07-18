const MapService = require('../services/map.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const geocode = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  if (!q) {
    throw new ApiError(400, 'Search query "q" is required');
  }
  const hits = await MapService.geocode(q);
  res.status(200).json(new ApiResponse(200, hits, 'Geocoding results retrieved successfully'));
});

const reverseGeocode = asyncHandler(async (req, res, next) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    throw new ApiError(400, 'Coordinates "lat" and "lng" are required');
  }
  const addressInfo = await MapService.reverseGeocode(lat, lng);
  res.status(200).json(new ApiResponse(200, addressInfo, 'Location reverse geocoded successfully'));
});

const getRoute = asyncHandler(async (req, res, next) => {
  const { from, to } = req.query;
  if (!from || !to) {
    throw new ApiError(400, 'Query parameters "from" and "to" in "lat,lng" format are required');
  }
  const [fromLat, fromLng] = from.split(',');
  const [toLat, toLng] = to.split(',');

  if (!fromLat || !fromLng || !toLat || !toLng) {
    throw new ApiError(400, 'Invalid coordinate format for route');
  }

  const route = await MapService.getRoute(fromLat, fromLng, toLat, toLng);
  res.status(200).json(new ApiResponse(200, route, 'Route calculated successfully'));
});

module.exports = {
  geocode,
  reverseGeocode,
  getRoute,
};
