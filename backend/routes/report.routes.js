const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const { auth, requireEmployee } = require('../middlewares/auth');

router.use(auth);
router.use(requireEmployee);

router.get('/employee/summary', reportController.getEmployeeSummary);

module.exports = router;
