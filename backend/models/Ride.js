const mongoose = require('mongoose');
const geoPointSchema = require('./GeoPoint');

const rideSchema = new mongoose.Schema(
  {
    // FIX: original Ride had no organizationId. The PDF describes this as
    // an Enterprise Carpooling Platform ("employees from registered
    // organizations"), and the assumptions section scopes users/admins
    // per-org. Without this field, "Find a Ride" search has no cheap way
    // to stay inside one company's rides — you'd have to $lookup through
    // Employee on every search just to filter by org. Denormalizing it
    // here makes the search index (below) actually usable.
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    pickupPoint: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, required: true },
    stops: [geoPointSchema],
    departureDate: { type: Date, required: true },
    departureTime: { type: String, required: true },
    isRecurring: { type: Boolean, default: false },
    // FIX: PDF 5.2 lists "Recurring Ride" as required search/publish info,
    // but the original schema only had the isRecurring flag with nowhere
    // to store the pattern — the README even flagged this as "not yet
    // modeled." Added a minimal recurrence rule so a recurring Ride can
    // generate future Ride documents (e.g. a daily commute, Mon–Fri).
    recurrenceRule: {
      daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sun..6=Sat
      endDate: Date,
    },
    availableSeats: { type: Number, required: true, min: 0 },
    occupiedSeats: { type: Number, default: 0, min: 0 },
    farePerSeat: { type: Number, required: true, min: 0 },
    estimatedDistanceKm: Number,
    estimatedDurationMin: Number,
    status: {
      type: String,
      enum: ['scheduled', 'started', 'completed', 'cancelled'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

rideSchema.index({ pickupPoint: '2dsphere' });
rideSchema.index({ destination: '2dsphere' });
// FIX: supports the actual "Find a Ride" query shape — same org, still
// open, on/after the requested date — without a full collection scan.
rideSchema.index({ organizationId: 1, status: 1, departureDate: 1 });

module.exports = mongoose.model('Ride', rideSchema);
