const express = require('express');
const patientController = require('../controllers/patient.controller');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

// Aplica el middleware a todas las rutas de pacientes
router.use(verifyToken);

// Metodos para consultar todos los Pacientes
router.get('/get-patients', patientController.getAllPatients);

// Metodos para consultar Paciente por Id
router.get('/get-patient/:id', patientController.getPatientById);

// Metodos para consultar Paciente por Document
router.get('/get-patient-by-doc/:id', patientController.getPatientByDocument);

//Metodo para Crear Pacientes
router.post('/create-patient', patientController.create);

// Metodo para Modificar Pacientes
router.put('/update-patient/:id', patientController.updatePatient);


//Metodo para Eliminar Pacientes 
router.delete('/delete-patient/:id', patientController.deletePatient);



module.exports = router;