const router = require('express').Router();
const vehicleExpenseController = require('../controllers/vehicleExpense.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { addVehicleExpenseSchema } = require('../validators/schemas');

router.use(auth);
router.use(requireEmployee);

router.post('/', validate(addVehicleExpenseSchema), vehicleExpenseController.addExpense);

module.exports = router;
