const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0, min: 0 },
    upiId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wallet', walletSchema);
