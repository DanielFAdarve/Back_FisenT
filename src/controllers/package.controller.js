// const response = require('../models/Response.models')
// const packageService = require('../services/packages.service');

// const getAllPackages = async (req, res) => {
//     try {
//         const packages = await packageService.getAllPackages();
//          res.status(200).send(response.set(200, 'Consultada la informacion de los paquetes',packages));

//     } catch (error) {
//         res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al obtener paquetes'));
//     }
// }


// const createPackage = async (req, res) => {
//     try {
//         const packageData = req.body;
//         const packages = await packageService.createPackage(packageData);
//          res.status(200).send(response.set(200, 'Se creo el paquete',packages));

//     } catch (error) {
//         res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al crear paquete'));
//     }
// }



// const updatePackage = async (req, res) => {
//     try {
//         const packageId = req.params.id;
//         if (!packageId) {
//             return res.status(400).send(response.set(400, 'ID del paquete es requerido'));
//         }
//         const packageData = req.body;
//         const packages = await packageService.updatePackage(packageId,packageData);
//          res.status(200).send(response.set(200, 'Se actualizo el paquete',packages));

//     } catch (error) {
//         res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al actualizar paquete'));
//     }
// }


// const deletePackage = async (req, res) => {
//     try {
//         const packageId = req.params.id;
//         if (!packageId) {
//             return res.status(400).send(response.set(400, 'ID del paquete es requerido'));
//         }
//         const packages = await packageService.deletePackage(packageId);
//          res.status(200).send(response.set(200, 'Se Elimino el paquete',packageId));

//     } catch (error) {
//         res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al eliminar paquete'));
//     }
// }

// module.exports = {
//     getAllPackages,
//     createPackage,
//     updatePackage,
//     deletePackage
// }


const response = require('../models/Response.models');
const packagesService = require('../services/packages.service');

module.exports = {

    async getAllPackages(req, res) {
        try {
            const packages = await packagesService.getAll();
            res.status(200).send(response.set(200, 'Consultada la informacion de los paquetes', packages));

        } catch (error) {
            res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al obtener paquetes'));
        }
    },

    async createPackage(req, res) {
        try {
            const pkg = await packagesService.create(req.body);
            res.send(response.set(200, "Paquete creado", pkg));
        } catch (error) {
            res.status(400).send(response.set(500, error.message));
        }
    },

    async getPackagesByPatient(req, res) {
        try {
            const pkgs = await packagesService.getByPatient(req.params.id);
            res.send(response.set(200, "Paquetes del paciente", pkgs));
        } catch (error) {
            res.status(400).send(response.set(500, error.message));
        }
    },

    async getPackageById(req, res) {
        try {
            const pkg = await packagesService.getById(req.params.id);
            res.send(response.set(200, "Detalle del paquete", pkg));
        } catch (error) {
            res.status(400).send(response.set(500, error.message));
        }
    },

    async closePackage(req, res) {
        try {
            const result = await packagesService.close(req.params.id);
            res.send(response.set(200, "Paquete cerrado", result));
        } catch (error) {
            res.status(400).send(response.set(500, error.message));
        }
    }
};