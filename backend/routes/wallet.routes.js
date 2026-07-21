const router = require('express').Router();
const walletController = require('../controllers/wallet.controller');
const { auth, requireEmployee } = require('../middlewares/auth');

router.post('/webhook', walletController.handleRazorpayWebhook);

router.get('/', auth, requireEmployee, walletController.getWallet);
router.post('/recharge', auth, requireEmployee, walletController.createRechargeOrder);
router.post('/recharge/mock-complete', auth, requireEmployee, walletController.mockCompletePayment);

module.exports = router;
