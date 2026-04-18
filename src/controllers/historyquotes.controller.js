const response = require('../models/Response.models');
const historyService = require('../services/historyquotes.service');

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
            const pdfBuffer = await historyService.exportPdf(req.params.id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="historia-${req.params.id}.pdf"`);
            return res.send(pdfBuffer);
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
