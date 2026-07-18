const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['credit', 'debit', 'refund', 'reward'], required: true },
    method: { type: String, enum: ['upi', 'card', 'qr', 'cash', 'wallet'], required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    description: String,
  },
  { timestamps: true }
);

transactionSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
// FIX: "View Balance" / wallet statement (5.6) is a paginated, newest-first
// list per wallet — without this compound index that query sorts
// in-memory once the ledger grows past a handful of entries.
transactionSchema.index({ walletId: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
