const { HistoryQuote, Cie10, Quotes } = require('../models');

module.exports = {
    async create(data) {
        if (!data.id_cita || !data.id_cie) {
            throw new Error('id_cita e id_cie son obligatorios');
        }

        const quote = await Quotes.findByPk(data.id_cita);
        if (!quote) throw new Error('La cita asociada no existe');

        const cie = await Cie10.findByPk(data.id_cie);
        if (!cie) throw new Error('El código CIE10 no existe');

        const existingHistory = await HistoryQuote.findOne({ where: { id_cita: data.id_cita } });
        if (existingHistory) {
            throw new Error('La cita ya tiene una evolución registrada');
        }

        return HistoryQuote.create(data);
    },

    getByQuote(id_cita) {
        return HistoryQuote.findAll({
            where: { id_cita },
            include: [Cie10]
        });
    }
};
