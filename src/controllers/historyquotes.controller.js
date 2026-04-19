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
            res.send(response.set(200, 'Historial', hist));
        } catch (e) {
            res.status(400).send(response.set(500, e.message));
        }
    }
};
