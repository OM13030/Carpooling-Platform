const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerRole: { type: String, enum: ['employee', 'admin'], required: true },
    type: { type: String, enum: ['upi', 'credit_card', 'debit_card', 'net_banking', 'wallet'], required: true },
    provider: { type: String, required: true, trim: true },
    token: { type: String, required: true, trim: true },
    maskedCard: { type: String, trim: true },
    lastFourDigits: { type: String, trim: true },
    expiryMonth: { type: String, trim: true },
    expiryYear: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentMethodSchema.index({ ownerId: 1, ownerRole: 1, isDefault: -1, createdAt: -1 });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);