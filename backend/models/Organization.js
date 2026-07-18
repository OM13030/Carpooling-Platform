const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    industry: String,
    logoUrl: String,
    carpoolConfig: {
      fuelPrice: { type: Number, default: 0 },
      operationalCostPerKm: { type: Number, default: 0 },
      rideCommissionPercent: { type: Number, default: 0 },
      walletMinimumBalance: { type: Number, default: 0 },
      maxRideDistanceKm: { type: Number, default: 100 },
      cancellationPolicy: String,
    },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
