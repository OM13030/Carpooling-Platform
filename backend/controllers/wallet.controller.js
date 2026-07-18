const walletService = require('../services/wallet.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

const getWallet = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const details = await walletService.getWalletDetails(employeeId, page, limit);
  res.status(200).json(new ApiResponse(200, details, 'Wallet details and transaction history retrieved successfully'));
});

const createRechargeOrder = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { amount } = req.body;
  const orderDetails = await walletService.createRechargeOrder(employeeId, amount);
  res.status(201).json(new ApiResponse(201, orderDetails, 'Recharge order created successfully'));
});

const mockCompletePayment = asyncHandler(async (req, res) => {
  const employeeId = req.user._id;
  const { orderId } = req.body;
  const transaction = await walletService.mockCompletePayment(employeeId, orderId);
  res.status(200).json(new ApiResponse(200, transaction, 'Mock payment completed successfully'));
});

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const result = await walletService.verifyWebhook(req.rawBody, signature);
  res.status(200).json(result);
});

module.exports = {
  getWallet,
  createRechargeOrder,
  mockCompletePayment,
  handleRazorpayWebhook,
};
