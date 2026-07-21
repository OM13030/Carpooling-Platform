const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    model: { type: String, required: true },
    manufacturer: String,
    fuelType: { type: String, enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid'], required: true },
    color: String,
    seatingCapacity: { type: Number, required: true, min: 1 },
    insuranceNumber: String,
    insuranceExpiry: Date,
    rcDocumentUrl: String,
    status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

vehicleSchema.index({ employeeId: 1, status: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
