const router = require('express').Router();
const settingsController = require('../controllers/settings.controller');
const { auth } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { settingsSchema, savedPlaceSchema, paymentMethodSchema, helpTicketSchema } = require('../validators/settings.schemas');

router.use(auth);

router.get('/', settingsController.getSettings);
router.put('/', validate(settingsSchema), settingsController.updateSettings);

router.get('/saved-places', settingsController.getSavedPlaces);
router.post('/saved-places', validate(savedPlaceSchema), settingsController.createSavedPlace);
router.delete('/saved-places/:id', settingsController.deleteSavedPlace);

router.get('/payment-methods', settingsController.getPaymentMethods);
router.post('/payment-methods', validate(paymentMethodSchema), settingsController.addPaymentMethod);
router.delete('/payment-methods/:id', settingsController.deletePaymentMethod);
router.patch('/payment-methods/:id/default', settingsController.makeDefaultPaymentMethod);

router.get('/help/faqs', settingsController.getFaqs);
router.post('/help/ticket', validate(helpTicketSchema), settingsController.createTicket);

module.exports = router;