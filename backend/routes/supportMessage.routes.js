const router = require('express').Router();
const supportMessageController = require('../controllers/supportMessage.controller');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.get('/', supportMessageController.getSupportMessages);
router.post('/', supportMessageController.sendSupportMessage);
router.post('/read', supportMessageController.markMessagesRead);

module.exports = router;
