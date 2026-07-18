const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // FIX: original schema had `firebaseUid` (required+unique) with no
    // password field — that only works if auth is delegated to Firebase.
    // You asked for bcrypt + JWT, so auth has to live in Mongo instead.
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false }, // hashed, rotated on each refresh
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
