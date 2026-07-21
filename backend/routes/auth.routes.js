const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { registerOrgSchema, registerEmployeeSchema, loginSchema } = require('../validators/schemas');

router.post('/register-org', validate(registerOrgSchema), authController.registerOrganization);
router.post('/register-employee', validate(registerEmployeeSchema), authController.registerEmployee);
router.post('/login-employee', validate(loginSchema), authController.loginEmployee);
router.post('/login-admin', validate(loginSchema), authController.loginAdmin);
router.post('/refresh', authController.refreshTokens);
router.post('/refresh-token', authController.refreshTokens);
router.post('/logout', auth, authController.logout);
router.get('/organizations', authController.getOrganizations);

// New specification routes
router.post('/google', authController.loginGoogle);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/me', auth, authController.getMe);
router.put('/complete-profile', auth, authController.completeProfile);

module.exports = router;
