const mongoose = require('mongoose');
const geoPointSchema = require('./GeoPoint');

const tripParticipantSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    // FIX: nothing on the original model traced a passenger row back to
    // the RideRequest that created it. Without this, "why was this
    // passenger charged this fareShare" or a refund lookup has no direct
    // path back to the original request/seat count.
    rideRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RideRequest', default: null },
    role: { type: String, enum: ['driver', 'passenger'], required: true },
    pickupPoint: { type: geoPointSchema },
    fareShare: { type: Number, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'wallet'], default: 'wallet' },
  },
  { timestamps: true }
);

tripParticipantSchema.index({ tripId: 1, employeeId: 1 }, { unique: true });
tripParticipantSchema.index({ employeeId: 1, paymentStatus: 1 });

module.exports = mongoose.model('TripParticipant', tripParticipantSchema);
