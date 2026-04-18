const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyquotes.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);

router.post('/create', historyController.create);
router.put('/update/:id', historyController.update);
router.get('/get-by-quote/:id', historyController.getByQuote);

module.exports = router;
