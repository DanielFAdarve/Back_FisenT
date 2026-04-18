const { HistoryQuote, Cie10, Quotes, Packages, Patient, sequelize } = require('../models');

const ANTECEDENT_FIELDS = [
    'antecedentes',
    'antecedentes_personales',
    'antecedentes_patologicos',
    'antecedentes_quirurgicos',
    'antecedentes_traumaticos',
    'antecedentes_farmacologicos',
    'antecedentes_familiares',
    'antecedentes_sociales'
];

const validateQuoteAndDiagnosis = async (id_cita, id_cie, transaction) => {
    const quote = await Quotes.findByPk(id_cita, { transaction });
    if (!quote) throw new Error('La cita asociada no existe');

    const cie = await Cie10.findByPk(id_cie, { transaction });
    if (!cie) throw new Error('El código CIE10 no existe');
};

const syncPatientAntecedentsFromHistory = async (id_cita, data, transaction) => {
    const payload = {};

    for (const key of ANTECEDENT_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            payload[key] = data[key];
        }
    }

    if (Object.keys(payload).length === 0) return;

    const quote = await Quotes.findByPk(id_cita, {
        include: [{ model: Packages, include: [{ model: Patient, as: 'patient' }] }],
        transaction
    });

    const patient = quote?.Package?.patient;
    if (!patient) return;

    await patient.update(payload, { transaction });
};

module.exports = {
    async create(data) {
        if (!data.id_cita || !data.id_cie) {
            throw new Error('id_cita e id_cie son obligatorios');
        }

        return sequelize.transaction(async (t) => {
            await validateQuoteAndDiagnosis(data.id_cita, data.id_cie, t);

            const existingHistory = await HistoryQuote.findOne({ where: { id_cita: data.id_cita }, transaction: t });
            if (existingHistory) {
                throw new Error('La cita ya tiene una evolución registrada');
            }

            const historyData = {
                ...data,
                fecha_evolucion: data.fecha_evolucion || new Date().toISOString().slice(0, 10)
            };

            const history = await HistoryQuote.create(historyData, { transaction: t });
            await syncPatientAntecedentsFromHistory(data.id_cita, data, t);

            return history;
        });
    },

    async update(id, data) {
        return sequelize.transaction(async (t) => {
            const history = await HistoryQuote.findByPk(id, { transaction: t });
            if (!history) {
                throw new Error('Historia no encontrada');
            }

            const nextQuoteId = data.id_cita || history.id_cita;
            const nextCieId = data.id_cie || history.id_cie;

            await validateQuoteAndDiagnosis(nextQuoteId, nextCieId, t);

            await history.update(data, { transaction: t });
            await syncPatientAntecedentsFromHistory(nextQuoteId, data, t);

            return history;
        });
    },

    getByQuote(id_cita) {
        return HistoryQuote.findAll({
            where: { id_cita },
            include: [Cie10]
        });
    }
};
