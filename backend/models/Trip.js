const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    // FIX: same reasoning as Ride — needed for org-scoped dashboards and
    // reports (5.9) without joining through Ride -> Employee every time.
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startTime: Date,
    endTime: Date,
    distanceKm: Number,
    durationMin: Number,
    fare: { type: Number, required: true },
    fuelCost: Number,
    carbonSavedKg: Number,
    // live tracking
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    // FIX: nothing recorded *when* currentLocation last changed, so the
    // frontend has no way to tell "driver's GPS died 10 minutes ago" from
    // "driver hasn't moved." Needed for a live-tracking UI to show a
    // stale/disconnected state instead of a silently frozen marker.
    locationUpdatedAt: Date,
    status: {
      type: String,
      enum: [
        'booked',
        'started',
        'in_progress',
        'completed',
        'payment_pending',
        'payment_completed',
        'cancelled',
      ],
      default: 'booked',
    },
  },
  { timestamps: true }
);

tripSchema.index({ currentLocation: '2dsphere' });
tripSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
