const response = require('../models/Response.models');
const professionalService = require('../services/professional.service');

// Listar todos los profesionales
const getAllProfessionals = async (req, res) => {
  try {
    const professionals = await professionalService.getAllProfessional(req.query);
    res.status(200).send(
      response.paginated(
        200,
        'Listado de Profesionales',
        professionals.data,
        professionals.pagination
      )
    );
  } catch (error) {
    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));
  }
};

module.exports = {
  getAllProfessionals
};
