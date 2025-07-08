const express = require('express');
const { uploadDevolution, getDevolutionsData ,muestra } = require('../controllers/patient.controller');
const router = express.Router();

// Metodos para consultar Pacientes
// router.get('/get-patients', muestra);
// Metodo para Crear Pacientes
// router.post('/create-patient', muestra);

router.get('/prueba', muestra);



module.exports = router;
