const express = require('express');
const professionalController = require('../controllers/professional.controller');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/get-all', professionalController.getAllProfessionals);


module.exports = router;
