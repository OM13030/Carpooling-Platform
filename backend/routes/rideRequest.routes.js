const router = require('express').Router();
const rideRequestController = require('../controllers/rideRequest.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { createRequestSchema } = require('../validators/schemas');

router.use(auth);
router.use(requireEmployee);

router.post('/', validate(createRequestSchema), rideRequestController.createRequest);
router.patch('/:id/accept', rideRequestController.acceptRequest);
router.patch('/:id/reject', rideRequestController.rejectRequest);
router.get('/ride/:rideId', rideRequestController.getRequestsForRide);
router.get('/my-requests', rideRequestController.getMyRequests);

module.exports = router;
