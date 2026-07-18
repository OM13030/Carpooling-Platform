const router = require('express').Router();
const organizationController = require('../controllers/organization.controller');
const adminController = require('../controllers/admin.controller');
const { auth, requireAdmin } = require('../middlewares/auth');

router.use(auth);
router.use(requireAdmin);

router.get('/config', organizationController.getCarpoolConfig);
router.patch('/config', organizationController.updateCarpoolConfig);
router.get('/employees', organizationController.getEmployees);
router.patch('/employees/:employeeId/status', organizationController.toggleEmployeeStatus);
router.get('/stats', adminController.getDashboardStats);

module.exports = router;
