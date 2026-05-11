const response = require('../models/Response.models');
const cie10Service = require('../services/cie10.service');

const create = async (req, res) => {
  try {
    const cie10 = await cie10Service.create(req.body);
    res.status(200).send(response.set(200, 'Código CIE10 creado', cie10));
  } catch (error) {
    res.status(400).send(response.set(400, error.message || 'No se pudo crear el código CIE10'));
  }
};

const getAll = async (req, res) => {
  try {
    const cie10List = await cie10Service.getAll({
      q: req.query.q,
      codigo: req.query.codigo,
      page: req.query.page,
      limit: req.query.limit
    });

    res.status(200).send(
      response.paginated(200, 'Listado CIE10', cie10List.data, cie10List.pagination)
    );
  } catch (error) {
    res.status(500).send(response.set(500, error.message || 'No se pudo consultar CIE10'));
  }
};


const update = async (req, res) => {
  try {
    const cie10 = await cie10Service.update(req.params.id, req.body);
    if (!cie10) {
      return res.status(404).send(response.set(404, 'Código CIE10 no encontrado'));
    }

    res.status(200).send(response.set(200, 'Código CIE10 actualizado', cie10));
  } catch (error) {
    res.status(400).send(response.set(400, error.message || 'No se pudo actualizar el código CIE10'));
  }
};

const getById = async (req, res) => {
  try {
    const cie10 = await cie10Service.getById(req.params.id);
    if (!cie10) {
      return res.status(404).send(response.set(404, 'Código CIE10 no encontrado'));
    }

    res.status(200).send(response.set(200, 'Código CIE10 encontrado', cie10));
  } catch (error) {
    res.status(500).send(response.set(500, error.message || 'No se pudo consultar CIE10'));
  }
};

const getByCode = async (req, res) => {
  try {
    const cie10 = await cie10Service.getByCode(req.params.code);
    if (!cie10) {
      return res.status(404).send(response.set(404, 'Código CIE10 no encontrado'));
    }

    res.status(200).send(response.set(200, 'Código CIE10 encontrado', cie10));
  } catch (error) {
    res.status(500).send(response.set(500, error.message || 'No se pudo consultar CIE10'));
  }
};

module.exports = {
  create,
  getAll,
  update,
  getById,
  getByCode
};
