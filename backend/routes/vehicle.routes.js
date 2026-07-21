const router = require('express').Router();
const vehicleController = require('../controllers/vehicle.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addVehicleSchema, updateVehicleSchema } = require('../validators/schemas');

router.use(auth);
router.use(requireEmployee);

router.post('/', validate(addVehicleSchema), vehicleController.addVehicle);
router.get('/', vehicleController.getVehicles);
router.patch('/:id', validate(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
