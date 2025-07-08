const uploadFile = async (params) => {
  if (!params.base64File) {
    throw new Error('Archivo base64 es requerido');
  }
  // const insertedRows = await uploadDevolutionsFromBase64(params.base64File);
  const insertedRows = "ok";
  return insertedRows;
};

const getDevolutions = async (params) => {
  try {
    return "pl";
  } catch (error) {
    console.error('Error en getDevolution controller:', error);
    throw error;
  }
};

module.exports = { uploadFile, getDevolutions };
