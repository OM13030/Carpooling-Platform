const router = require('express').Router();
const rideController = require('../controllers/ride.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { publishRideSchema } = require('../validators/schemas');

router.use(auth);

router.post('/', requireEmployee, validate(publishRideSchema), rideController.publishRide);
router.get('/search', rideController.searchRides);
router.get('/offered', requireEmployee, rideController.getMyOfferedRides);
router.get('/:id', rideController.getRideDetails);
router.post('/trigger-recurrence', rideController.triggerRecurringCheck);

module.exports = router;
