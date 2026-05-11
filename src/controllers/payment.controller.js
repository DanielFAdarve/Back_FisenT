const paymentService = require('../services/payment.service');
const response = require('../models/Response.models');

const getAll = async (req, res) => {
  try {
    const result = await paymentService.getAll(req.query);
    res.send(response.paginated(200, 'Listado de pagos', result.data, result.pagination));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const getById = async (req, res) => {
  try {
    const result = await paymentService.getById(req.params.id);
    res.send(response.set(200, 'Pago encontrado', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const getPackageSummary = async (req, res) => {
  try {
    const result = await paymentService.getPackageSummary(req.params.id);
    res.send(response.set(200, 'Resumen de pagos del paquete', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};


const getAppointmentSummary = async (req, res) => {
  try {
    const result = await paymentService.getAppointmentSummary(req.params.id);
    res.send(response.set(200, 'Resumen de pagos de la cita', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const getAllPaymentsForPackage = async (req, res) => {
  try {
    const result = await paymentService.getAllPaymentsForPackage(req.params.id);
    res.send(response.set(200, 'Resumen de pagos del paquete', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const createPayment = async (req, res) => {
  try {
    const result = await paymentService.createPayment(req.body);
    res.send(response.set(200, 'Pago registrado', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const updatePayment = async (req, res) => {
  try {
    const result = await paymentService.updatePayment(req.params.id, req.body);
    res.send(response.set(200, 'Pago actualizado', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const deletePayment = async (req, res) => {
  try {
    const result = await paymentService.deletePayment(req.params.id);
    res.send(response.set(200, 'Pago eliminado', result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

module.exports = { getAll, getById, getPackageSummary, getAppointmentSummary, getAllPaymentsForPackage, createPayment, updatePayment, deletePayment };
