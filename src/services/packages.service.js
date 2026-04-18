const { Packages, AttentionPackages, Quotes, Patient, StatusPackages, Professional, Cie10, sequelize } = require('../models');

module.exports = {

    async create(data) {
        const { id_pacientes, id_paquetes_atenciones, id_profesional, id_cie_secundario } = data;

        // verificar si existe uno activo
        const active = await Packages.findOne({
            where: {
                id_pacientes,
                id_paquetes_atenciones,
                id_estado_citas: 1 // estado "activo"
            }
        });

        if (active) throw new Error('El paciente ya tiene un paquete activo de este tipo.');

        if (id_profesional) {
            const professional = await Professional.findByPk(id_profesional);
            if (!professional) throw new Error('Profesional no encontrado para asignar el paquete');
        }

        if (id_cie_secundario) {
            const cie10 = await Cie10.findByPk(id_cie_secundario);
            if (!cie10) throw new Error('CIE10 secundario no encontrado para el motivo de consulta');
        }

        return await Packages.create(data);
    },

    async getAll() {
        return await AttentionPackages.findAll({});
    },
    async getByPatient(id_pacientes) {
        return await Packages.findAll({
            where: { id_pacientes },
            include: [
                {
                    model: AttentionPackages,
                    as: 'attentionPackage'
                },
                {
                    model: StatusPackages,
                    as: 'statusPackage'
                },
                {
                    model: Professional,
                    as: 'professional'
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis'
                },
                {
                    model: Quotes,
                    attributes: ['id', 'fecha_agendamiento', 'numero_sesion', 'id_estado_citas']
                }
            ]
        });
    },

    async getById(id) {
        return await Packages.findByPk(id, {
            include: [
                {
                    model: Patient,
                    as: 'patient'
                },
                {
                    model: AttentionPackages,
                    as: 'attentionPackage'
                },
                {
                    model: StatusPackages,
                    as: 'statusPackage'
                },
                {
                    model: Professional,
                    as: 'professional'
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis'
                },
                {
                    model: Quotes
                }
            ]
        });
    },

    async close(id) {
        return await Packages.update(
            { id_estado_citas: 3 }, // cerrado
            { where: { id } }
        );
    },

    async checkAndClosePackage(id_paquetes, transaction = null) {
        const t = transaction || await sequelize.transaction();
        const ownTransaction = !transaction;
        try {
            const paquete = await Packages.findByPk(id_paquetes, { include: [{ model: AttentionPackages, as: 'attentionPackage' }], transaction: t });
            if (!paquete) throw new Error('Paquete no encontrado');

            const used = await Quotes.count({ where: { id_paquetes }, transaction: t });

            const config = paquete.attentionPackage || (await paquete.getAttentionPackage({ transaction: t }));

            if (config && used >= config.cantidad_sesiones) {
                await Packages.update({ id_estado_citas: 3 }, { where: { id: id_paquetes }, transaction: t });
            }

            if (ownTransaction) await t.commit();
            return true;
        } catch (err) {
            if (ownTransaction) await t.rollback();
            throw err;
        }
    }
};
