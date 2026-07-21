const router = require('express').Router();
const tripController = require('../controllers/trip.controller');
const { auth, requireEmployee } = require('../middlewares/auth');

router.use(auth);
router.use(requireEmployee);

router.get('/active', tripController.getActiveTrip);
router.get('/history', tripController.getTripHistory);
router.get('/:id', tripController.getTrip);
router.patch('/:id/start', tripController.startTrip);
router.patch('/:id/complete', tripController.completeTrip);
router.post('/:id/pay', tripController.payPendingFare);

module.exports = router;
