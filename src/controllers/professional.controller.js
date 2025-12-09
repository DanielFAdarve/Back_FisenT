const response = require('../models/Response.models')
const professionalService = require('../services/professional.service');

//Listar todos los Profesionale
const getAllProfessionals = async (req, res) => {
  try{

    const professionals = await professionalService.getAllProfessional();
    res.status(200).send(response.set(200, 'Listado de Profesionales',professionals));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};


module.exports = { 
    getAllProfessionals
    };