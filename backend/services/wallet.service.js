const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const walletRepository = require('../repositories/wallet.repository');
const transactionRepository = require('../repositories/transaction.repository');
const miscRepository = require('../repositories/misc.repository');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const transactionHelper = require('../utils/transactionHelper');

class WalletService {
  async getWalletDetails(employeeId, page, limit) {
    let wallet = await walletRepository.findByEmployeeId(employeeId);
    if (!wallet) {
      wallet = await walletRepository.create({ employeeId, balance: 0 });
    }
    const transactions = await transactionRepository.getHistory(wallet._id, { page, limit });
    const total = await transactionRepository.countHistory(wallet._id);
    return { wallet, transactions, total, page, limit };
  }

  async createRechargeOrder(employeeId, amount) {
    let wallet = await walletRepository.findByEmployeeId(employeeId);
    if (!wallet) {
      wallet = await walletRepository.create({ employeeId, balance: 0 });
    }

    if (amount <= 0) throw new ApiError(400, 'Recharge amount must be positive');

    if (razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), 
          currency: 'INR',
          receipt: wallet._id.toString()
        });

        await transactionRepository.create({
          walletId: wallet._id,
          amount,
          type: 'credit',
          method: 'upi', 
          status: 'pending',
          razorpayOrderId: order.id,
          description: 'Wallet recharge via Razorpay'
        });

        return {
          orderId: order.id,
          amount: amount,
          currency: 'INR',
          keyId: process.env.RAZORPAY_KEY_ID,
          isMock: false
        };
      } catch (err) {
        logger.error(`Razorpay order creation failed: ${err.message}`);
        throw new ApiError(502, `Payment gateway error: ${err.message}`);
      }
    } else {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 9)}`;
      await transactionRepository.create({
        walletId: wallet._id,
        amount,
        type: 'credit',
        method: 'upi',
        status: 'pending',
        razorpayOrderId: mockOrderId,
        description: 'Wallet recharge (Mock Mode)'
      });

      return {
        orderId: mockOrderId,
        amount: amount,
        currency: 'INR',
        keyId: 'mock_key_id',
        isMock: true
      };
    }
  }

  async mockCompletePayment(employeeId, orderId) {
    const session = await transactionHelper.startSession();
    try {
      const transaction = await transactionRepository.findByOrderId(orderId, session);
      if (!transaction) throw new ApiError(404, 'Order transaction not found');
      if (transaction.status === 'success') {
        await transactionHelper.commitTransaction(session);
        return transaction;
      }

      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 9)}`;

      const exists = await transactionRepository.findByPaymentId(mockPaymentId, session);
      if (exists) {
        throw new ApiError(400, 'Duplicate payment ID');
      }

      transaction.status = 'success';
      transaction.razorpayPaymentId = mockPaymentId;
      transaction.razorpaySignature = 'mock_signature';
      await transaction.save({ session });

      await walletRepository.updateBalance(employeeId, transaction.amount, session);

      await miscRepository.createNotification({
        employeeId,
        type: 'payment_successful',
        title: 'Wallet Recharged!',
        message: `₹${transaction.amount} has been successfully added to your wallet.`
      }, { session });

      await miscRepository.createAuditLog({
        actorId: employeeId,
        actorType: 'Employee',
        action: 'WALLET_RECHARGE_COMPLETED',
        metadata: { orderId, amount: transaction.amount }
      }, { session });

      await transactionHelper.commitTransaction(session);
      return transaction;
    } catch (error) {
      await transactionHelper.abortTransaction(session);
      throw error;
    }
  }

  async verifyWebhook(rawBody, signature) {
    if (!signature || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      throw new ApiError(400, 'Webhook secret or signature missing');
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new ApiError(400, 'Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload.event;

    if (event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; 

      const session = await transactionHelper.startSession();
      try {
        const existingTx = await transactionRepository.findByPaymentId(paymentId, session);
        if (existingTx) {
          await transactionHelper.commitTransaction(session);
          return { success: true, message: 'Webhook already processed' };
        }

        const transaction = await transactionRepository.findByOrderId(orderId, session);
        if (!transaction) {
          throw new ApiError(404, `Transaction for order ${orderId} not found`);
        }

        if (transaction.status === 'success') {
          await transactionHelper.commitTransaction(session);
          return { success: true, message: 'Order already credited' };
        }

        transaction.status = 'success';
        transaction.razorpayPaymentId = paymentId;
        transaction.razorpaySignature = signature;
        await transaction.save({ session });

        const wallet = await mongoose.model('Wallet').findById(transaction.walletId).session(session);
        await walletRepository.updateBalance(wallet.employeeId, amount, session);

        await miscRepository.createNotification({
          employeeId: wallet.employeeId,
          type: 'payment_successful',
          title: 'Wallet Recharged!',
          message: `₹${amount} has been successfully added to your wallet.`
        }, { session });

        await miscRepository.createAuditLog({
          actorId: wallet.employeeId,
          actorType: 'Employee',
          action: 'WALLET_RECHARGE_WEBHOOK',
          metadata: { orderId, paymentId, amount }
        }, { session });

        await transactionHelper.commitTransaction(session);
        return { success: true };
      } catch (err) {
        await transactionHelper.abortTransaction(session);
        throw err;
      }
    }

    return { success: true, message: 'Event not handled' };
  }
}

module.exports = new WalletService();
