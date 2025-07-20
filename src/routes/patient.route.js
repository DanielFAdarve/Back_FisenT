const express = require('express');
const { create, getAllPatients, getPatientById, getPatientByDocument, updatePatient, deletePatient, muestra } = require('../controllers/patient.controller');
const router = express.Router();

// Metodos para consultar todos los Pacientes
router.get('/get-patients', getAllPatients);

// Metodos para consultar Paciente por Id
router.get('/get-patient/:id', getPatientById);

// Metodos para consultar Paciente por Document
router.get('/get-patient-by-doc/:id', getPatientByDocument);

//Metodo para Crear Pacientes
router.post('/create-patient', create);

// Metodo para Modificar Pacientes
router.put('/update-patient/:id', updatePatient);


//Metodo para Eliminar Pacientes 
router.delete('/delete-patient/:id', deletePatient);



router.get('/prueba', muestra);



module.exports = router;