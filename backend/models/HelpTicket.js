const mongoose = require('mongoose');

const helpTicketSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerRole: { type: String, enum: ['employee', 'admin'], required: true },
    category: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

helpTicketSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('HelpTicket', helpTicketSchema);