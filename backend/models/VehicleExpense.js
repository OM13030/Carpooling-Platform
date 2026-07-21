const mongoose = require('mongoose');

const vehicleExpenseSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    type: {
      type: String,
      enum: ['maintenance', 'insurance', 'fuel', 'other'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    incurredOn: { type: Date, required: true, default: Date.now },
    notes: String,
  },
  { timestamps: true }
);

vehicleExpenseSchema.index({ employeeId: 1, incurredOn: -1 });
vehicleExpenseSchema.index({ vehicleId: 1, incurredOn: -1 });

module.exports = mongoose.model('VehicleExpense', vehicleExpenseSchema);
