const router = require('express').Router();
const employeeController = require('../controllers/employee.controller');
const { auth, requireEmployee } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateProfileSchema } = require('../validators/schemas');

router.use(auth);
router.use(requireEmployee);

router.get('/profile', employeeController.getProfile);
router.patch('/profile', validate(updateProfileSchema), employeeController.updateProfile);

module.exports = router;
