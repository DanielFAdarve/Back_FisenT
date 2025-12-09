const paymentService = require("../services/payment.service");
const response = require("../models/Response.models");

const getAll = async (req, res) => {
  try {
    const result = await paymentService.getAll();
    res.send(response.set(200, "Listado de pagos", result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const getById = async (req, res) => {
  try {
    const result = await paymentService.getById(req.params.id);
    res.send(response.set(200, "Pago encontrado", result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const createPayment = async (req, res) => {
  try {
    const result = await paymentService.createPayment(req.body);
    res.send(response.set(200, "Pago registrado", result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const updatePayment = async (req, res) => {
  try {
    const result = await paymentService.updatePayment(req.params.id, req.body);
    res.send(response.set(200, "Pago actualizado", result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

const deletePayment = async (req, res) => {
  try {
    const result = await paymentService.deletePayment(req.params.id);
    res.send(response.set(200, "Pago eliminado", result));
  } catch (e) {
    res.status(500).send(response.set(500, e.message));
  }
};

module.exports = { getAll, getById, createPayment, updatePayment, deletePayment };