const express = require('express');
const router = express.Router();
const quotesController = require('../controllers/quotes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);
router.get('/get-quotes', quotesController.getAllQuotes);

router.post('/create-quotes', quotesController.createQuotes);
router.put('/update-quote/:id', quotesController.updateQuotes);
router.delete('/delete-quotes/:id', quotesController.deleteQuotes);




module.exports = router;