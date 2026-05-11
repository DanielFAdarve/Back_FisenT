const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

router.get('/dashboard', reportController.getDashboard);
router.get('/revenue', reportController.getRevenue);
router.get('/appointments/status-distribution', reportController.getAppointmentStatusDistribution);
router.get('/professionals/top', reportController.getTopProfessionals);
router.get('/packages/by-type', reportController.getPackagesByType);
router.get('/packages/near-completion', reportController.getPackagesNearCompletion);
router.get('/payments/recent', reportController.getRecentPayments);
router.get('/sessions/summary', reportController.getSessionsSummary);

module.exports = router;
