// const { Packages, AttentionPackages, Quotes, Patient, StatusPackages } = require('../models');

// module.exports = {

//     async create(data) {

//         const { id_pacientes, id_paquetes_atenciones } = data;

//         // verificar si existe uno activo
//         const active = await Packages.findOne({
//             where: {
//                 id_pacientes,
//                 id_paquetes_atenciones,
//                 id_estado_citas: 1 // estado "activo"
//             }
//         });

//         if (active) throw new Error("El paciente ya tiene un paquete activo de este tipo.");

//         return await Packages.create(data);
//     },

//     async getByPatient(id_pacientes) {
//         return await Packages.findAll({
//             where: { id_pacientes },
//             include: [
//                 {
//                     model: AttentionPackages,
//                     as: "attentionPackage"
//                 },
//                 {
//                     model: StatusPackages,
//                     as: "statusPackage"
//                 },
//                 {
//                     model: Quotes,
//                     attributes: ["id", "fecha_agendamiento", "numero_sesion", "id_estado_citas"]
//                 }
//             ]
//         });
//     },

//     async getById(id) {
//         return await Packages.findByPk(id, {
//             include: [
//                 {
//                     model: Patient,
//                     as: "patient"
//                 },
//                 {
//                     model: AttentionPackages,
//                     as: "attentionPackage"
//                 },
//                 {
//                     model: StatusPackages,
//                     as: "statusPackage"
//                 },
//                 {
//                     model: Quotes,
//                     include: ["Professional"]
//                 }
//             ]
//         });
//     },

//     async close(id) {
//         return await Packages.update(
//             { id_estado_citas: 3 }, // cerrado
//             { where: { id } }
//         );
//     },

//     async checkAndClosePackage(id_paquetes, transaction = null) {
//         const t = transaction || await sequelize.transaction();
//         let ownTransaction = !transaction;
//         try {
//             const paquete = await Packages.findByPk(id_paquetes, { include: [AttentionPackages], transaction: t });
//             if (!paquete) throw new Error('Paquete no encontrado');


//             const used = await Quotes.count({ where: { id_paquetes }, transaction: t });


//             if (used >= paquete.AttentionPackage.cantidad_sesiones) {
//                 await Packages.update({ id_estado_citas: 3 }, { where: { id: id_paquetes }, transaction: t });
//             }


//             if (ownTransaction) await t.commit();
//             return true;
//         } catch (err) {
//             if (ownTransaction) await t.rollback();
//             throw err;
//         }
//     }
// };

const { Packages, AttentionPackages, Quotes, Patient, StatusPackages, sequelize } = require('../models');

module.exports = {

    async create(data) {
        const { id_pacientes, id_paquetes_atenciones } = data;

        // verificar si existe uno activo
        const active = await Packages.findOne({
            where: {
                id_pacientes,
                id_paquetes_atenciones,
                id_estado_citas: 1 // estado "activo"
            }
        });

        if (active) throw new Error("El paciente ya tiene un paquete activo de este tipo.");

        return await Packages.create(data);
    },

    async getByPatient(id_pacientes) {
        return await Packages.findAll({
            where: { id_pacientes },
            include: [
                {
                    model: AttentionPackages,
                    as: "attentionPackage"
                },
                {
                    model: StatusPackages,
                    as: "statusPackage"
                },
                {
                    model: Quotes,
                    attributes: ["id", "fecha_agendamiento", "numero_sesion", "id_estado_citas"]
                }
            ]
        });
    },

    async getById(id) {
        return await Packages.findByPk(id, {
            include: [
                {
                    model: Patient,
                    as: "patient"
                },
                {
                    model: AttentionPackages,
                    as: "attentionPackage"
                },
                {
                    model: StatusPackages,
                    as: "statusPackage"
                },
                {
                    model: Quotes,
                    include: ["Professional"]
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
        let ownTransaction = !transaction;
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