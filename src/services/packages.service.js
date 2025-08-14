//Paquetes Service
//Dependencies
const { Packages, Patient, AttentionPackages, StatusPackages } = require('../models');


class PackageService {

    async getAllPackages() {

        let infoPackages = await Packages.findAll(
            {
                include: [
                    { model: Patient, as: 'patient' },
                    { model: AttentionPackages, as: 'attentionPackage' },
                    { model: StatusPackages, as: 'statusPackage' }
                ]
            });

        if (infoPackages.length < 1) {
            return 'No hay paquetes registrados';
        }

        const data = infoPackages.map((dataPackage) => {
            return {
                id: dataPackage.id,
                id_pacientes: dataPackage.id_pacientes,
                id_paquetes_atenciones: dataPackage.id_paquetes_atenciones,
                id_estado_citas: dataPackage.id_estado_citas,
                patient_name: dataPackage.patient.nombre,
                descripcion_paquete: dataPackage.attentionPackage.descripcion,
                cantidad_sesiones: dataPackage.attentionPackage.cantidad_sesiones,
                estado_paquete: dataPackage.statusPackage.nombre
            }
        });

        return data;
    }

    async createPackage(data) {
        if (!data.id_pacientes || !data.id_paquetes_atenciones || !data.id_estado_citas) {
            throw new Error('Faltan datos requeridos para crear el paquete');
        }

        return await Packages.create(data);
    }

    async updatePackage(id, data) {
        const PackageRecord = await Packages.findOne({ where: { id } });
        if (!PackageRecord) {
            throw new Error('Paquete no encontrado');
        }
        return await PackageRecord.update(data);

    }

    async deletePackage(id) {
        const PackageRecord = await Packages.findOne({ where: { id } });
        if (!PackageRecord) {
            throw new Error('Paquete no encontrado');
        }
        return await PackageRecord.destroy();
    }

}

module.exports = new PackageService();

