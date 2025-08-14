const express = require('express');
const router = express.Router();
const historyquotesController = require('../controllers/historyquotes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);
router.get('/get-history-quotes', historyquotesController.getAllHistoryquotes);

router.post('/create-historyquotes', historyquotesController.createHistoryquotes);
router.put('/update-historyquote/:id', historyquotesController.updateHistoryquotes);
router.delete('/delete-historyquotes/:id', historyquotesController.deleteHistoryquotes);




module.exports = router;