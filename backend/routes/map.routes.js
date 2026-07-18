const router = require('express').Router();
const mapController = require('../controllers/map.controller');
const { auth } = require('../middlewares/auth');

router.use(auth);

router.get('/geocode', mapController.geocode);
router.get('/reverse', mapController.reverseGeocode);
router.get('/route', mapController.getRoute);

module.exports = router;
