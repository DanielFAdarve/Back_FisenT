const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);
router.get('/get-packages', packageController.getAllPackages);

router.post('/create-package', packageController.createPackage);
router.put('/update-package/:id', packageController.udpatePackage);
router.delete('/delete-package/:id', packageController.deletePackage);




module.exports = router;