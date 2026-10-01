const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyquotes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);

router.post('/create', historyController.create);
router.put('/update/:id', historyController.update);
router.get('/export-docx/:id', historyController.exportDocx);
router.get('/export-pdf/:id', historyController.exportDocx); // Alias legado: devuelve DOCX por compatibilidad.
router.post('/sesion-entrenamiento/create', historyController.createTrainingSession);
router.put('/sesion-entrenamiento/update/:id', historyController.updateTrainingSession);
router.get('/sesion-entrenamiento/export-docx/:id', historyController.exportTrainingSessionDocx);
router.get('/sesion-entrenamiento/:id', historyController.getTrainingSession);
router.get('/get-by-quote/:id', historyController.getByQuote);
router.get('/get-by-patient/:id', historyController.getByPatient);
router.get('/get-summary-by-history-number/:id', historyController.getSummaryByHistoryNumber);
router.get('/get-summary-by-quote-number/:id', historyController.getSummaryByQuoteNumber);
router.delete('/delete-quote/:id', historyController.deleteQuote);


module.exports = router;
