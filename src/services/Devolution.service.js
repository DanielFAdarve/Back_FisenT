
const { getDevolution,uploadDevolutionsFromBase64 } = require('../models/DataBase.model');

const uploadFile = async (params) => {
  if (!params.base64File) {
    throw new Error('Archivo base64 es requerido');
  }
  const insertedRows = await uploadDevolutionsFromBase64(params.base64File);
  return insertedRows;
};

const getDevolutions = async (params) => {
  try {
    const devoluciones = await getDevolution();
    return devoluciones;
  } catch (error) {
    console.error('Error en getDevolution controller:', error);
    throw error;
  }
};

module.exports = { uploadFile, getDevolutions };
