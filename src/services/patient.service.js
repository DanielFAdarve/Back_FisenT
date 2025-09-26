const { Patient } = require('../models');

const createPatient = async (data) => {

  if (data.tipo_doc.length < 1) {
    return 'El tipo de doc viene vacio';
  }

  return await Patient.create(data);
}

const getAllPatients = async () => {
  return await Patient.findAll({where: { estado: true }});
}

const getPatientById = async (id) => {
  return await Patient.findOne({ where: { id } })
}


const getPatientByDocumentNumber = async (num_doc) => {
  return await Patient.findOne({ where: { num_doc } })
}

const updatePatient = async (id, data) => {

  const [updated] = await Patient.update(data, { where: { id } });
  return updated ? await Patient.findOne({ where: { id } }) : null;

}

const deletePatient = async (id) => {

  // return await Patient.destroy({ where: { id } });
    const [updated] = await Patient.update({estado:false}, { where: { id } });
  return updated ? await Patient.findOne({ where: { id } }) : null;

}

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  getPatientByDocumentNumber,
  updatePatient,
  deletePatient
}