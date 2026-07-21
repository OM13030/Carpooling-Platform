const Transaction = require('../models/Transaction');

class TransactionRepository {
  async findById(id) {
    return Transaction.findById(id).populate('tripId');
  }

  async findByOrderId(razorpayOrderId, session = null) {
    let query = Transaction.findOne({ razorpayOrderId });
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async findByPaymentId(razorpayPaymentId, session = null) {
    let query = Transaction.findOne({ razorpayPaymentId });
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async create(data, session = null) {
    const [tx] = await Transaction.create([data], { session });
    return tx;
  }

  async update(id, data, session = null) {
    return Transaction.findByIdAndUpdate(id, data, { new: true, session });
  }

  async getHistory(walletId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    return Transaction.find({ walletId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('tripId');
  }

  async countHistory(walletId) {
    return Transaction.countDocuments({ walletId });
  }
}

module.exports = new TransactionRepository();
