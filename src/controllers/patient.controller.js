const response = require('../models/Response.models')
const patientService = require('../services/patient.service');

//Crear Paciente
const create = async (req, res) => {
  try{
    const patient = await patientService.createPatient(req.body);
    res.status(200).send(response.set(200, 'Ok',patient));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};

//Listar todos los Pacientes
const getAllPatients = async (req, res) => {
  try{

    const patients = await patientService.getAllPatients();
    res.status(200).send(response.set(200, 'Listado de Pacientes',patients));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};

//Obtener paciente por llave Primaria
const getPatientById = async (req, res) => {
  try{
    // console.log(req.params);
    const patient = await patientService.getPatientById(req.params.id);
    res.status(200).send(response.set(200, 'Paciente listado', patient));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};

const getPatientByDocument = async (req, res) => {
  try{
    // console.log(req.params);
    const patient = await patientService.getPatientByDocumentNumber(req.params.id);
    res.status(200).send(response.set(200, 'Paciente listado', patient));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};

const updatePatient = async (req, res) => {
  try{
    // console.log(req.params);
    const patient = await patientService.updatePatient(req.params.id, req.body );
    res.status(200).send(response.set(200, 'Paciente actualizado', patient));

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};


const deletePatient = async (req, res) => {
  try{
    // console.log(req.params);
    const deleted = await patientService.deletePatient(req.params.id);

    if(deleted){
      res.status(200).send(response.set(200, 'Paciente eliminado'));
    }else{
       res.status(200).send(response.set(200, 'Paciente no encontrado'));
    }

  }catch(error){

    res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor'));

  }
};


module.exports = { 
    create,
    getAllPatients,
    getPatientById,
    getPatientByDocument,
    updatePatient,
    deletePatient,
    };