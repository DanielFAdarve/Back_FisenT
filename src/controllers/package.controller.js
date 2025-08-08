const response = require('../models/Response.models')
const packageService = require('../services/packages.service');

const getAllPackages = async (req, res) => {
    try {
        const packages = await packageService.getAllPackages();
         res.status(200).send(response.set(200, 'Consultada la informacion de los paquetes',packages));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al obtener paquetes'));
    }
}


const createPackage = async (req, res) => {
    try {
        const packageData = req.body;
        const packages = await packageService.createPackage(packageData);
         res.status(200).send(response.set(200, 'Se creo el paquete',packages));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al crear paquete'));
    }
}



const updatePackage = async (req, res) => {
    try {
        const packageId = req.params.id;
        if (!packageId) {
            return res.status(400).send(response.set(400, 'ID del paquete es requerido'));
        }
        const packageData = req.body;
        const packages = await packageService.updatePackage(packageId,packageData);
         res.status(200).send(response.set(200, 'Se actualizo el paquete',packages));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al actualizar paquete'));
    }
}


const deletePackage = async (req, res) => {
    try {
        const packageId = req.params.id;
        if (!packageId) {
            return res.status(400).send(response.set(400, 'ID del paquete es requerido'));
        }
        const packages = await packageService.deletePackage(packageId);
         res.status(200).send(response.set(200, 'Se Elimino el paquete',packageId));

    } catch (error) {
        res.status(400).send(response.set(error.status || 500, error.message || 'No hubo respuesta del servidor al eliminar paquete'));
    }
}

module.exports = {
    getAllPackages,
    createPackage,
    updatePackage,
    deletePackage
}