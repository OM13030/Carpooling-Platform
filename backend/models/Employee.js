const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    employeeCode: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true },
    profilePhotoUrl: String,
    // FIX: original schema had `firebaseUid` (required+unique) with no
    // password field. Swapped for a bcrypt hash so login/registration can
    // run entirely on your own Express + JWT stack.
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    department: String,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    officeLocation: String,
    designation: String,
    emergencyContact: String,
    platformAccess: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    // FIX (perf): Rating is its own collection (one doc per trip per
    // direction), which is correct for storage — but "Driver Details"
    // shows up on every ride in the Find-a-Ride results list (PDF 5.2),
    // and averaging Rating on every list-render would mean an aggregation
    // per driver per search. Cache the rollup here instead and update it
    // with a single $inc-style recompute whenever a new Rating is saved.
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });

module.exports = mongoose.model('Employee', employeeSchema);
