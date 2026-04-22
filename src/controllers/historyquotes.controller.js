const response = require('../models/Response.models');
const historyService = require('../services/historyquotes.service');
const docService = require('../services/doc.service')

module.exports = {
    async create(req, res) {
        try {
            const hist = await historyService.create(req.body);
            res.send(response.set(200, 'Historial creado', hist));
        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    },

    async update(req, res) {
        try {
            const hist = await historyService.update(req.params.id, req.body);
            res.send(response.set(200, 'Historial actualizado', hist));
        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    },


    async exportPdf(req, res) {
        try {
            const history = await historyService.getHistoryData(req.params.id);
            const docFile = await docService.buildHistoryDocx(history);
            // const pdfBuffer = await docService.convertToPdf(docFile);
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=historia.docx'
            );
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', `attachment; filename="historia-${req.params.id}.pdf"`);

            return res.send(docFile);
            // return res.send(response.set(200, 'Historial', historial));


        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    },

    async getByQuote(req, res) {
        try {
            const data = await historyService.getByQuote(req.params.id);

            if (!data) {
                return res.send(response.set(404, 'No existe la cita'));
            }

            const patient = data.package?.patient || {};
            const diagnosis = patient.diagnosis || {};
            const history = data.HistoryQuotes?.[0] || {}; // puede no existir

            const result = {
                // 🔹 CITA
                id_cita: data.id,
                fecha: data.fecha_agendamiento,
                hora_inicio: data.horario_inicio,

                // 🔹 HISTORIA (puede venir vacía)
                id_historial: history.id || null,
                cie10_historia: history.Cie10 || null,
                descripcion_estado_paciente: history.descripcion_estado_paciente || null,
                subjetivo: history.subjetivo || null,
                objetivo: history.objetivo || null,
                intervencion: history.intervencion || null,
                recomendaciones: history.recomendaciones || null,

                // 🔹 PACIENTE (SIEMPRE DEBE VENIR)
                tipo_doc: patient.tipo_doc,
                num_doc: patient.num_doc,
                telefono: patient.telefono,
                nombre: patient.nombre,
                apellido: patient.apellido,
                telefono_secundario: patient.telefono_secundario,
                email: patient.email,
                eps: patient.eps,
                ocupacion: patient.ocupacion,
                modalidad_deportiva: patient.modalidad_deportiva,

                // 🔹 ANTECEDENTES
                antecedentes: patient.antecedentes,
                antecedentes_personales: patient.antecedentes_personales,
                antecedentes_patologicos: patient.antecedentes_patologicos,
                antecedentes_quirurgicos: patient.antecedentes_quirurgicos,
                antecedentes_traumaticos: patient.antecedentes_traumaticos,
                antecedentes_farmacologicos: patient.antecedentes_farmacologicos,
                antecedentes_familiares: patient.antecedentes_familiares,
                antecedentes_sociales: patient.antecedentes_sociales,

                // 🔹 CIE10 PACIENTE
                cie10_paciente: diagnosis
            };

            res.send(response.set(200, 'Historial', result));

        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    },

    async getSummaryByHistoryNumber(req, res) {
        try {
            const data = await historyService.getSummaryByHistoryNumber(req.params.id);

            if (!data) {
                return res.send(response.set(404, 'No existe la historia clínica'));
            }

            res.send(response.set(200, 'Resumen de historia clínica', data));
        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    }
};
