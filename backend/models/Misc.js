const mongoose = require('mongoose');
const geoPointSchema = require('./GeoPoint');

const savedPlaceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    label: { type: String, required: true }, // e.g. Home, Office
    // FIX: was a plain { address, coordinates } object with no `type`
    // field — swapped for the shared GeoPoint so saved places can be
    // geo-queried the same way Ride/RideRequest points are (e.g. "prefill
    // nearest saved place to current GPS location").
    location: { type: geoPointSchema, required: true },
  },
  { timestamps: true }
);
savedPlaceSchema.index({ employeeId: 1 });

const notificationSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: [
        'ride_requested',
        'ride_accepted',
        'ride_cancelled',
        'ride_started',
        'ride_completed',
        'wallet_updated',
        'payment_successful',
        'vehicle_approved',
        'trip_reminder',
        'admin_broadcast',
      ],
      required: true,
    },
    title: String,
    message: String,
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// FIX: the notification bell badge count ("unread for employee X") is
// the single most frequent query this collection will see — index it.
notificationSchema.index({ employeeId: 1, read: 1, createdAt: -1 });

const ratingSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    fromEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    toEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: String,
  },
  { timestamps: true }
);
// FIX: prevents the same person rating the same counterpart on the same
// trip twice, and speeds up "has X already rated Y for this trip" checks.
ratingSchema.index({ tripId: 1, fromEmployeeId: 1, toEmployeeId: 1 }, { unique: true });

const messageSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);
messageSchema.index({ tripId: 1, createdAt: 1 });

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, refPath: 'actorType' },
    actorType: { type: String, enum: ['Employee', 'Admin'] },
    action: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, expires: '7d' }, // admin/API log TTL
  },
  { timestamps: false }
);

module.exports = {
  SavedPlace: mongoose.model('SavedPlace', savedPlaceSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Rating: mongoose.model('Rating', ratingSchema),
  Message: mongoose.model('Message', messageSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
};
