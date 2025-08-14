//Citas service

const { HistoryQuote,Quotes, Cie10 } = require('../models');


class HistoryquotesService {

    async getAllHistoryquotes() {

        let infoHistoryquotes = await HistoryQuote.findAll(
            {
                include: [
                    { model: Quotes, as: 'Quotes' },
                    { model: Cie10, as: 'Cie10' },
                ]
            });

        if (infoHistoryquotes.length < 1) {
            return 'No hay historia registrada';
        }

        const data = infoHistoryquotes.map((dataHistoryquotes) => {
            return {
                id: dataHistoryquotes.id,
                id_cita: dataHistoryquotes.id_cita,
                id_cie: dataHistoryquotes.id_cie,

                //Preguntar si la descripción del estado paciente y recomendaciones deben estar acá?
            }
        });

        return data;
    }

    async createHistoryquotes(data) {
        if (!data.id_cita || !data.id_cie) {
            throw new Error('Faltan datos requeridos para crear la historia');
        }

        return await HistoryQuote.create(data);
    }

    async updateHistoryquotes(id, data) {
        const HistoryquotesRecord = await HistoryQuote.findOne({ where: { id } });
        if (!HistoryquotessRecord) {
            throw new Error('Historia no encontrada');
        }
        return await HistoryquotesRecord.update(data);

    }

    async deleteHistoryquotes(id) {
        const HistoryquotesRecord = await HistoryQuote.findOne({ where: { id } });
        if (!HistoryquotesRecord) {
            throw new Error('Historia no encontrada');
        }
        return await HistoryquotesRecord.destroy();
    }

}

module.exports = new HistoryquotesService();
