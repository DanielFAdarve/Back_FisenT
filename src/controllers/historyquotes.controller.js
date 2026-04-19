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
            const hist = await historyService.getByQuote(req.params.id);

            const result = hist.map(h => {
                const quote = h.Quotes || {};
                const pack = quote.package || {};
                const patient = pack.patient || {};
                const diagnosis = patient.diagnosis || {};

                return {
                    // 🔹 DATOS DE LA HISTORIA (CITA)
                    id_historial: h.id,
                    id_cita: h.id_cita,
                    cie10_historia: h.Cie10 || null,

                    // 🔹 PACIENTE
                    tipo_doc: patient.tipo_doc,
                    num_doc: patient.num_doc,
                    telefono: patient.telefono,
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

                    // 🔹 CIE10 DEL PACIENTE
                    cie10_paciente: diagnosis
                };
            });

            res.send(response.set(200, 'Historial', result));

        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    }
};
