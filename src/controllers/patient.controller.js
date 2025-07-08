const support = require('../services/patient.service');
const response = require('../models/Response.models')

const uploadDevolution = async (req, res) => {
  try {
    const { base64File } = req.body;

    if (!base64File) {
      return res.status(400).json({ error: 'Archivo base64 requerido' });
    }

    const insertedRows = await support.uploadFile({ base64File });
    res.status(200).send(response.set(200, `${insertedRows} filas insertadas correctamente` ));
    
  } catch (error) {
    console.error('Error en uploadDevolution:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

const getDevolutionsData = async (req, res) => {
  try {

    const result = await support.getDevolutions();

    res.status(200).send(response.set(200, 'Se consultaron los datos de las devoluciones', result));

  } catch (error) {

    res.status(400).send(response.set(error.status || 500, error.message || 'no hubo respuesta del servidor'));
  }
};

const muestra = async (req, res) => {
  try {

    // const result = await support.getDevolutions();

    res.status(200).send(response.set(200, 'Se realiza Muestra de la info'));

  } catch (error) {

    res.status(400).send(response.set(error.status || 500, error.message || 'no hubo respuesta del servidor'));
  }
};



module.exports = { uploadDevolution, getDevolutionsData,muestra };


