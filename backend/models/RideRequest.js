const mongoose = require('mongoose');
const geoPointSchema = require('./GeoPoint');

const rideRequestSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    seatsRequested: { type: Number, required: true, default: 1, min: 1 },
    // FIX: was a plain { address, coordinates } object — swapped for the
    // shared GeoJSON GeoPoint so this stays queryable the same way Ride's
    // points are.
    pickupPoint: { type: geoPointSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

rideRequestSchema.index({ rideId: 1, passengerId: 1 }, { unique: true });

module.exports = mongoose.model('RideRequest', rideRequestSchema);
