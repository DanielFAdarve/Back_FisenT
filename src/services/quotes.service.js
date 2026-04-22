const { Quotes, Packages, AttentionPackages, Patient, Professional, StatusQuotes } = require('../models');

module.exports = {

    async create(data) {
        if (!data.horario_inicio)
            throw new Error('La hora de inicio es obligatoria');

        if (!data.id_profesional && !data.id_paquetes) {
            throw new Error('Debe indicar un profesional o un paquete asociado');
        }

        if (data.id_paquetes) {
            const paquete = await Packages.findByPk(
                data.id_paquetes,
                { include: [{ model: AttentionPackages, as: 'attentionPackage' }] }
            );
            if (!paquete) throw new Error('Paquete no encontrado');
            if (paquete.id_estado_citas !== 1) throw new Error('El paquete no está activo');

            if (!data.id_profesional && paquete.id_profesional) {
                data.id_profesional = paquete.id_profesional;
            }

            const used = await Quotes.count({ where: { id_paquetes: data.id_paquetes } });
            const config = paquete.attentionPackage || (await paquete.getAttentionPackage());

            if (!config) throw new Error('Configuración del paquete no encontrada');
            if (used >= config.cantidad_sesiones)
                throw new Error('No hay sesiones disponibles en el paquete');

            data.numero_sesion = used + 1;
        }

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

        return await Quotes.create(data);
    },

    async getAll() {
        return await Quotes.findAll({
            include: [
                {
                    model: Packages,
                    as: 'package',
                    include: [
                        {
                            model: Patient,
                            as: 'patient',
                            attributes: ['nombre', 'apellido']
                        }
                    ]
                },
                {
                    model: Professional,
                    as: 'professional',
                    attributes: ['nombre']
                },
                {
                    model: StatusQuotes,
                    as: 'status',
                    attributes: ['nombre']
                }
            ]
        });
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
    },
    async update(id, data) {
        const quote = await Quotes.findByPk(id);
        if (!quote) throw new Error('Cita no encontrada');

        // 🔥 importante: mantener ID para evitar choque consigo misma
        const payload = {
            ...quote.toJSON(),
            ...data,
            id // 👈 clave para validación de colisiones
        };

        // 🔥 reutilizas TODA la lógica de negocio
        await this.create(payload);

        // 🔥 ahora sí actualizas
        await quote.update(data);

        return await Quotes.findByPk(id, {
            include: [
                {
                    model: Packages,
                    as: 'package',
                    include: [
                        {
                            model: Patient,
                            as: 'patient',
                            attributes: ['nombre', 'apellido']
                        }
                    ]
                },
                {
                    model: Professional,
                    as: 'professional',
                    attributes: ['nombre']
                }
            ]
        });
    }
};
