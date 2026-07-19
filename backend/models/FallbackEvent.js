const mongoose = require('mongoose');
const geoPointSchema = require('./GeoPoint');

const fallbackEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    pickup: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, required: true },
    provider: { type: String, required: true, default: 'uber' },
    action: { type: String, enum: ['shown', 'clicked'], required: true },
  },
  { timestamps: true }
);

// Index to track events per user and date
fallbackEventSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FallbackEvent', fallbackEventSchema);
