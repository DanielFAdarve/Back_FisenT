const response = require('../models/Response.models');
const reportService = require('../services/report.service');

const getFilters = (req) => ({
  period: req.query.period,
  startDate: req.query.startDate,
  endDate: req.query.endDate,
  limit: req.query.limit,
  threshold: req.query.threshold
});

const handleReport = (serviceMethod, message) => async (req, res) => {
  try {
    const result = await serviceMethod(getFilters(req));
    res.status(200).send(response.set(200, message, result));
  } catch (error) {
    res.status(500).send(response.set(500, error.message || 'No se pudo consultar el reporte'));
  }
};

module.exports = {
  getDashboard: handleReport(reportService.getDashboard, 'Dashboard report'),
  getRevenue: handleReport(reportService.getRevenue, 'Revenue report'),
  getAppointmentStatusDistribution: handleReport(
    reportService.getAppointmentStatusDistribution,
    'Appointment status distribution'
  ),
  getTopProfessionals: handleReport(reportService.getTopProfessionals, 'Top professionals'),
  getPackagesByType: handleReport(reportService.getPackagesByType, 'Packages by type'),
  getPackagesNearCompletion: handleReport(reportService.getPackagesNearCompletion, 'Packages near completion'),
  getRecentPayments: handleReport(reportService.getRecentPayments, 'Recent payments'),
  getSessionsSummary: handleReport(reportService.getSessionsSummary, 'Sessions summary')
};
