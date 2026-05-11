const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);

router.get('/', paymentController.getAll);
router.get('/package-summary/:id', paymentController.getPackageSummary);
router.get('/package-all-summary/:id', paymentController.getAllPaymentsForPackage);
router.get('/appointment-summary/:id', paymentController.getAppointmentSummary);
router.get('/:id', paymentController.getById);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;
