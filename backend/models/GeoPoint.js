const mongoose = require('mongoose');

// Shared GeoJSON Point sub-schema.
// Every location field in this app (pickup, destination, saved place,
// live trip location) uses THIS shape so every one of them can carry a
// 2dsphere index and be queried with $geoNear / $near consistently.
// Fixed from the original design, where Ride used this GeoJSON shape
// but RideRequest, TripParticipant and SavedPlace used a plain
// { address, coordinates } object with no `type` field — that plain
// shape cannot be 2dsphere-indexed, so "find nearest passenger pickup"
// or "recalculate saved-place distance" queries would silently fail
// or fall back to slow in-app math.
const geoPointSchema = new mongoose.Schema(
  {
    address: String,
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

module.exports = geoPointSchema;
