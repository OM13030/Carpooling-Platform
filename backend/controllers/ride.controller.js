const rideService = require('../services/ride.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const redis = require('../utils/redis');
const fallbackService = require('../services/fallback/fallbackService');

const publishRide = asyncHandler(async (req, res) => {
  const driverId = req.user._id;
  const orgId = req.user.organizationId;
  const ride = await rideService.publishRide(driverId, orgId, req.body);
  res.status(201).json(new ApiResponse(201, ride, 'Ride offered successfully'));
});

const searchRides = asyncHandler(async (req, res) => {
  const rides = await rideService.searchRides(req.user.organizationId, req.query);
  res.status(200).json(new ApiResponse(200, rides, 'Matched rides retrieved successfully'));
});

const postSearchRides = asyncHandler(async (req, res) => {
  const { pickup, destination, date, time, seats } = req.body;
  const orgId = req.user.organizationId;

  // Generate cache key
  const cacheKey = `search:${orgId}:${pickup.lat}:${pickup.lng}:${destination.lat}:${destination.lng}:${date}:${time}:${seats}`;
  
  // Try retrieving cached results
  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      return res.status(200).json(new ApiResponse(200, parsed, 'Matched rides retrieved from cache'));
    }
  } catch (err) {
    // Fail silently on cache errors
  }

  const searchParams = {
    pickupLng: pickup.lng,
    pickupLat: pickup.lat,
    destLng: destination.lng,
    destLat: destination.lat,
    departureDate: `${date}T${time}:00`,
    seats
  };

  const rides = await rideService.searchRides(orgId, searchParams);

  let responseData = {};
  if (rides.length > 0) {
    responseData = {
      status: 'found',
      rides
    };
  } else {
    const pCoords = { coordinates: [pickup.lng, pickup.lat], address: pickup.address };
    const dCoords = { coordinates: [destination.lng, destination.lat], address: destination.address };
    const fallbacks = fallbackService.getAvailableFallbacks(pCoords, dCoords);
    
    responseData = {
      status: 'not_found',
      fallback: fallbacks[0] || null,
      fallbacks
    };
  }

  // Store in cache for 30s
  try {
    await redis.setex(cacheKey, 30, JSON.stringify(responseData));
  } catch (err) {
    // Fail silently on cache errors
  }

  res.status(200).json(new ApiResponse(200, responseData, rides.length > 0 ? 'Matched rides found' : 'No matching rides found'));
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
  postSearchRides,
  getMyOfferedRides,
  getRideDetails,
  triggerRecurringCheck,
};
