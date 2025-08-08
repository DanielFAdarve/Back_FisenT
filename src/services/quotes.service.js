//Citas service

const { Quotes,Professional, StatusQuotes, Packages } = require('../models');


class QuotesService {

    async getAllQuotes() {

        let infoQuotes = await Quotes.findAll(
            {
                include: [
                    { model: Professional, as: 'Professional' },
                    { model: StatusQuotes, as: 'StatusQuotes' },
                    { model: Packages, as: 'Packages' },
                ]
            });

        if (infoQuotes.length < 1) {
            return 'No hay citas registradas';
        }

        const data = infoQuotes.map((dataQuotes) => {
            return {
                id: dataQuotes.id,
                id_estado_citas: dataQuotes.id_estado_citas,
                id_profesional: dataQuotes.id_profesional,
                id_paquetes: dataQuotes.id_paquetes,
            }
        });

        return data;
    }

    async createQuote(data) {
        if (!data.id_estado_citas || !data.id_profesional || !data.id_paquetes || !data.fecha_agendamiento) {
            throw new Error('Faltan datos requeridos para crear la cita');
        }

        return await Quotes.create(data);
    }

    async updateQuotes(id, data) {
        const QuotesRecord = await Quotes.findOne({ where: { id } });
        if (!QuotesRecord) {
            throw new Error('Cita no encontrada');
        }
        return await QuotesRecord.update(data);

    }

    async deleteQuotes(id) {
        const QuotesRecord = await Quotes.findOne({ where: { id } });
        if (!QuotesRecord) {
            throw new Error('Cita no encontrada');
        }
        return await QuotesRecord.destroy();
    }

}

module.exports = new QuotesService();
