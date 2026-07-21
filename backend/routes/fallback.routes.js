const router = require('express').Router();
const fallbackController = require('../controllers/fallback.controller');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.post('/analytics/uber-fallback', fallbackController.logFallbackEvent);
router.get('/fallback/providers', fallbackController.getFallbackProviders);

module.exports = router;
