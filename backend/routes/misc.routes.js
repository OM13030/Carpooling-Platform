const router = require('express').Router();
const miscController = require('../controllers/misc.controller');
const { auth, requireEmployee } = require('../middlewares/auth');

router.use(auth);
router.use(requireEmployee);

router.get('/places', miscController.getSavedPlaces);
router.post('/places', miscController.createSavedPlace);
router.delete('/places/:id', miscController.deleteSavedPlace);

router.get('/notifications', miscController.getNotifications);
router.post('/notifications/read', miscController.markNotificationsRead);

router.post('/ratings', miscController.rateParticipant);

router.get('/chat/:tripId', miscController.getTripMessages);
router.post('/chat/:tripId', miscController.sendTripMessage);

module.exports = router;
