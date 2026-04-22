// const response = require('../models/Response.models');
// const quotesService = require('../services/quotes.service');

// module.exports = {

//     async createQuote(req, res) {
//         try {
//             const quote = await quotesService.create(req.body);
//             res.send(response.set(200, 'Cita creada', quote));
//         } catch (err) {
//             res.status(400).send(response.set(400, err.message));
//         }
//     },

//     async getQuotesByPackage(req, res) {
//         try {
//             const qts = await quotesService.getByPackage(req.params.id);
//             res.send(response.set(200, "Citas del paquete", qts));
//         } catch (err) {
//             res.status(400).send(response.set(500, err.message));
//         }
//     }
// };

// controllers/quotes.controller.js
const response = require('../models/Response.models');
const quotesService = require('../services/quotes.service');

module.exports = {

    async createQuote(req, res) {
        try {
            const quote = await quotesService.create(req.body);
            res.send(response.set(200, 'Cita creada', quote));
        } catch (err) {
            res.status(400).send(response.set(400, err.message));
        }
    },
    async getAllQuotes(req, res) {
        try {
            const qts = await quotesService.getAll();

            const result = qts.map(q => {
                const pack = q.package || {};
                const patient = pack.patient || {};
                const professional = q.professional || {};
                const status = q.status || {};

                return {
                    id: q.id,
                    fecha: q.fecha_agendamiento,
                    hora_inicio: q.horario_inicio,
                    hora_fin: q.horario_fin,
                    numero_sesion: q.numero_sesion,
                    pagado: q.pagado,
                    motivo: q.motivo,

                    // 🔹 PACIENTE
                    paciente: `${patient.nombre || ''} ${patient.apellido || ''}`.trim(),

                    // 🔹 PROFESIONAL
                    profesional: professional.nombre || null,

                    // 🔹 ESTADO
                    estado: status.nombre || null
                };
            });

            res.send(response.set(200, "Citas", result));

        } catch (err) {
            res.status(400).send(response.set(500, err.message));
        }

    },
    async getAllAttentionPackages(req, res) {
        try {
            const qts = await quotesService.getAllAttentionPackages();
            res.send(response.set(200, "Paquetes de atenciones ", qts));
        } catch (err) {
            res.status(400).send(response.set(500, err.message));
        }
    },

    async getQuotesByPackage(req, res) {
        try {
            const qts = await quotesService.getByPackage(req.params.id);
            res.send(response.set(200, "Citas del paquete", qts));
        } catch (err) {
            res.status(400).send(response.set(500, err.message));
        }
    },

    async getAvailability(req, res) {
        try {
            const id_prof = req.params.id;
            const fecha = req.query.date;
            if (!fecha) return res.status(400).send(response.set(400, 'Parámetro date es requerido (YYYY-MM-DD)'));
            const list = await quotesService.getAvailability(id_prof, fecha);
            res.send(response.set(200, 'Disponibilidad', list));
        } catch (err) {
            res.status(500).send(response.set(500, err.message));
        }
    },

    async deleteQuote(req, res) {
        try {
            const id = req.params.id;
            await quotesService.delete(id);
            res.send(response.set(200, 'Cita eliminada'));
        } catch (err) {
            res.status(500).send(response.set(500, err.message));
        }
    },
    async updateQuote(req, res) {
        try {
            const id = req.params.id;
            const data = req.body;
            const updatedQuote = await quotesService.update(id, data);
            res.send(response.set(200, 'Cita actualizada', updatedQuote));
        } catch (err) {
            res.status(400).send(response.set(400, err.message));
        }
    }
}
