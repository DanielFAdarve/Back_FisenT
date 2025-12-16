const express = require('express');
const router = express.Router();
const packagesController = require('../controllers/package.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// router.use(verifyToken);
// router.get('/get-packages', packageController.getAllPackages);

// router.post('/create-package', packageController.createPackage);
// router.put('/update-package/:id', packageController.updatePackage);
// router.delete('/delete-package/:id', packageController.deletePackage);

router.post('/create', packagesController.createPackage);
router.get('/get-by-patient/:id', packagesController.getPackagesByPatient);
router.get('/get-packages', packagesController.getAllPackages);
router.get('/get/:id', packagesController.getPackageById);
router.put('/close/:id', packagesController.closePackage);


module.exports = router;