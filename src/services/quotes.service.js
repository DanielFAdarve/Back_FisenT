// const { Quotes, Packages, AttentionPackages, sequelize } = require('../models');

// module.exports = {

//     async create(data) {
//         if (!data.horario_inicio || !data.horario_fin)
//             throw new Error('Horario de inicio y fin son obligatorios');

//         // Validación de colisión optimizada
//         const existing = await Quotes.findAll({
//             where: {
//                 id_profesional: data.id_profesional,
//                 fecha_agendamiento: data.fecha_agendamiento
//             }
//         });

//         const startNew = new Date(`${data.fecha_agendamiento}T${data.horario_inicio}:00`);
//         const endNew = new Date(`${data.fecha_agendamiento}T${data.horario_fin}:00`);

//         for (const q of existing) {
//             const startExist = new Date(`${q.fecha_agendamiento}T${q.horario_inicio}:00`);
//             const endExist = new Date(`${q.fecha_agendamiento}T${q.horario_fin}:00`);

//             if (startNew < endExist && startExist < endNew) {
//                 throw new Error('La cita colisiona con otra cita del profesional');
//             }
//         }

//         // Validar sesiones disponibles si usa paquete
//         if (data.id_paquetes) {
//             const paquete = await Packages.findByPk(
//                 data.id_paquetes, { include: [AttentionPackages] }
//             );

//             if (!paquete) throw new Error('Paquete no encontrado');

//             const used = await Quotes.count({ where: { id_paquetes: data.id_paquetes } });

//             if (used >= paquete.AttentionPackages.cantidad_sesiones)
//                 throw new Error('No hay sesiones disponibles en el paquete');

//             data.numero_sesion = used + 1;
//         }

//         const created = await Quotes.create(data);

//         return created;
//     },

//     async getByPackage(id_paquetes) {
//         return await Quotes.findAll({ where: { id_paquetes } });
//     },

//     async getAvailability(id_profesional, fecha) {
//         return await Quotes.findAll({
//             where: { id_profesional, fecha_agendamiento: fecha }
//         });
//     },

//     async delete(id) {
//         return await Quotes.destroy({ where: { id } });
//     }
// };

// services/quotes.service.js
const { Quotes, Packages, AttentionPackages } = require('../models');

module.exports = {

    // async create(data) {
    //     // data: { fecha_agendamiento (YYYY-MM-DD), id_paquetes, id_profesional, horario_inicio, horario_fin, motivo, ... }
    //     if (!data.horario_inicio || !data.horario_fin)
    //         throw new Error('Horario de inicio y fin son obligatorios');

    //     // Load existing quotes for professional + date (optimized)
    //     const existing = await Quotes.findAll({
    //         where: {
    //             id_profesional: data.id_profesional,
    //             fecha_agendamiento: data.fecha_agendamiento
    //         }
    //     });

    //     const startNew = new Date(`${data.fecha_agendamiento}T${data.horario_inicio}:00`);
    //     const endNew = new Date(`${data.fecha_agendamiento}T${data.horario_fin}:00`);

    //     for (const q of existing) {
    //         // if editing and same id, skip collision with itself: caller must handle
    //         if (data.id && q.id === data.id) continue;

    //         const startExist = new Date(`${q.fecha_agendamiento}T${q.horario_inicio}:00`);
    //         const endExist = new Date(`${q.fecha_agendamiento}T${q.horario_fin}:00`);

    //         if (startNew < endExist && startExist < endNew) {
    //             throw new Error('La cita colisiona con otra cita del profesional');
    //         }
    //     }

    //     // If package present, validate sessions available
    //     if (data.id_paquetes) {
    //         const paquete = await Packages.findByPk(data.id_paquetes, { include: [{ model: AttentionPackages, as: 'attentionPackage' }] });
    //         if (!paquete) throw new Error('Paquete no encontrado');

    //         const used = await Quotes.count({ where: { id_paquetes: data.id_paquetes } });
    //         const config = paquete.attentionPackage || (await paquete.getAttentionPackage());

    //         if (!config) throw new Error('Configuración del paquete no encontrada');

    //         if (used >= config.cantidad_sesiones) {
    //             throw new Error('No hay sesiones disponibles en el paquete');
    //         }

    //         data.numero_sesion = used + 1;
    //     }

    //     const created = await Quotes.create(data);

    //     return created;
    // },

    async create(data) {
        if (!data.horario_inicio)
            throw new Error('La hora de inicio es obligatoria');

        const existing = await Quotes.findAll({
            where: {
                id_profesional: data.id_profesional,
                fecha_agendamiento: data.fecha_agendamiento
            }
        });

        const startNew = new Date(`${data.fecha_agendamiento}T${data.horario_inicio}:00`);
        const endNew = data.horario_fin
            ? new Date(`${data.fecha_agendamiento}T${data.horario_fin}:00`)
            : null;

        for (const q of existing) {
            if (data.id && q.id === data.id) continue;
            if (!endNew || !q.horario_fin) continue;

            const startExist = new Date(`${q.fecha_agendamiento}T${q.horario_inicio}:00`);
            const endExist = new Date(`${q.fecha_agendamiento}T${q.horario_fin}:00`);

            if (startNew < endExist && startExist < endNew) {
                throw new Error('La cita colisiona con otra cita del profesional');
            }
        }

        if (data.id_paquetes) {
            const paquete = await Packages.findByPk(
                data.id_paquetes,
                { include: [{ model: AttentionPackages, as: 'attentionPackage' }] }
            );
            if (!paquete) throw new Error('Paquete no encontrado');

            const used = await Quotes.count({ where: { id_paquetes: data.id_paquetes } });
            const config = paquete.attentionPackage || (await paquete.getAttentionPackage());

            if (!config) throw new Error('Configuración del paquete no encontrada');
            if (used >= config.cantidad_sesiones)
                throw new Error('No hay sesiones disponibles en el paquete');

            data.numero_sesion = used + 1;
        }

        return await Quotes.create(data);
    },

    async getAll() {
        return await Quotes.findAll();
    },
    async getAllAttentionPackages() {
        return await AttentionPackages.findAll();
    },

    async getByPackage(id_paquetes) {
        return await Quotes.findAll({ where: { id_paquetes } });
    },

    async getAvailability(id_profesional, fecha) {
        return await Quotes.findAll({
            where: { id_profesional, fecha_agendamiento: fecha }
        });
    },

    async delete(id) {
        return await Quotes.destroy({ where: { id } });
    }
};
