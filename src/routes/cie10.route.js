const express = require('express');
const cie10Controller = require('../controllers/cie10.controller');

const router = express.Router();

router.post('/create', cie10Controller.create);
router.get('/all', cie10Controller.getAll);
router.get('/code/:code', cie10Controller.getByCode);
router.get('/:id', cie10Controller.getById);

module.exports = router;
