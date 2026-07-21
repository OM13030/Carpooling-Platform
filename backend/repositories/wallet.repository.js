const Wallet = require('../models/Wallet');

class WalletRepository {
  async findByEmployeeId(employeeId, session = null) {
    let query = Wallet.findOne({ employeeId });
    if (session) {
      query = query.session(session);
    }
    return query;
  }

  async create(data) {
    return Wallet.create(data);
  }

  async updateBalance(employeeId, amountDiff, session = null) {
    return Wallet.findOneAndUpdate(
      { employeeId, balance: { $gte: amountDiff < 0 ? -amountDiff : 0 } },
      { $inc: { balance: amountDiff } },
      { new: true, session }
    );
  }
}

module.exports = new WalletRepository();
