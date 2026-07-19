const FallbackEvent = require('../models/FallbackEvent');
const fallbackService = require('../services/fallback/fallbackService');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

// POST /api/analytics/uber-fallback
const logFallbackEvent = asyncHandler(async (req, res) => {
  const { pickup, destination, provider, action } = req.body;
  const userId = req.user._id;

  const event = await FallbackEvent.create({
    userId,
    pickup: {
      address: pickup.address,
      coordinates: [pickup.lng, pickup.lat]
    },
    destination: {
      address: destination.address,
      coordinates: [destination.lng, destination.lat]
    },
    provider: provider || 'uber',
    action
  });

  res.status(201).json(new ApiResponse(201, event, 'Fallback analytics event logged successfully'));
});

// GET /api/fallback/providers
const getFallbackProviders = asyncHandler(async (req, res) => {
  const { pickupLat, pickupLng, destLat, destLng } = req.query;

  let fallbacks = [];
  if (pickupLat && pickupLng && destLat && destLng) {
    const pickup = { coordinates: [parseFloat(pickupLng), parseFloat(pickupLat)] };
    const destination = { coordinates: [parseFloat(destLng), parseFloat(destLat)] };
    fallbacks = fallbackService.getAvailableFallbacks(pickup, destination);
  } else {
    // Return empty links if endpoints are not passed yet
    fallbacks = fallbackService.getEnabledProviders().map(p => ({
      provider: p.name,
      logoUrl: p.logoUrl,
      deepLink: ''
    }));
  }

  res.status(200).json(new ApiResponse(200, fallbacks, 'Fallback providers retrieved successfully'));
});

module.exports = {
  logFallbackEvent,
  getFallbackProviders
};
