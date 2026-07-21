const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    senderRole: { type: String, enum: ['employee', 'admin'], required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

supportMessageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
