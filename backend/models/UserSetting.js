const mongoose = require('mongoose');

const userSettingSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerRole: { type: String, enum: ['employee', 'admin'], required: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    notificationPreferences: {
      tripAlerts: { type: Boolean, default: true },
      paymentReceipts: { type: Boolean, default: true },
      supportResponses: { type: Boolean, default: true },
      adminBroadcasts: { type: Boolean, default: true },
    },
    quickAccess: {
      type: [String],
      default: ['my-trips', 'my-vehicle', 'payment-methods', 'saved-places', 'help', 'chat'],
    },
  },
  { timestamps: true }
);

userSettingSchema.index({ ownerId: 1, ownerRole: 1 }, { unique: true });

module.exports = mongoose.model('UserSetting', userSettingSchema);