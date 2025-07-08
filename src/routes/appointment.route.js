const express = require('express');
const { uploadDevolution, getDevolutionsData ,muestra } = require('../controllers/patient.controller');
const router = express.Router();

router.post('/cargar-devoluciones', uploadDevolution);
router.get('/consultar-devoluciones', getDevolutionsData);
router.get('/prueba', muestra);



module.exports = router;
