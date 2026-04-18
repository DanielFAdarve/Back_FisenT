const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
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

const buildHistoryPdf = async (history) => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    const margin = 40;
    let y = height - margin;

    const drawTitle = (text) => {
        page.drawText(text, { x: margin, y, size: 14, font: boldFont, color: rgb(0, 0, 0) });
        y -= 24;
    };

    const drawLabelValue = (label, value) => {
        page.drawText(`${label}: ${value || 'N/A'}`, { x: margin, y, size: 10.5, font, color: rgb(0, 0, 0) });
        y -= 16;
    };

    const drawParagraph = (label, value) => {
        page.drawText(`${label}:`, { x: margin, y, size: 11, font: boldFont, color: rgb(0, 0, 0) });
        y -= 14;

        const text = String(value || 'N/A');
        const maxCharsPerLine = 95;
        const words = text.split(' ');
        let line = '';

        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (candidate.length > maxCharsPerLine) {
                page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
                y -= 13;
                line = word;
            } else {
                line = candidate;
            }
        }

        if (line) {
            page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0, 0, 0) });
            y -= 15;
        }

        y -= 4;
    };

    const quote = history.Quotes;
    const pkg = quote?.Package;
    const patient = pkg?.patient;
    const ciePrincipal = history.Cie10;
    const cieSecundario = pkg?.secondaryDiagnosis;

    drawTitle('HISTORIA CLINICA FISIOTERAPEUTICA');
    drawLabelValue('Paciente', patient ? `${patient.nombre} ${patient.apellido}` : 'N/A');
    drawLabelValue('Documento', patient?.num_doc);
    drawLabelValue('Fecha evolucion', history.fecha_evolucion || new Date().toISOString().slice(0, 10));
    drawLabelValue('Fecha cita', quote?.fecha_agendamiento);
    drawLabelValue('Diagnostico principal (CIE10)', ciePrincipal ? `${ciePrincipal.codigo} - ${ciePrincipal.descripcion}` : 'N/A');
    drawLabelValue('Motivo de consulta (CIE10 secundario)', cieSecundario ? `${cieSecundario.codigo} - ${cieSecundario.descripcion}` : 'N/A');

    y -= 8;

    drawParagraph('Subjetivo', history.subjetivo);
    drawParagraph('Objetivo', history.objetivo);
    drawParagraph('Intervencion', history.intervencion);
    drawParagraph('Estado del paciente', history.descripcion_estado_paciente);
    drawParagraph('Recomendaciones', history.recomendaciones);

    drawParagraph('Antecedentes personales', patient?.antecedentes_personales || patient?.antecedentes);
    drawParagraph('Antecedentes patologicos', patient?.antecedentes_patologicos);
    drawParagraph('Antecedentes quirurgicos', patient?.antecedentes_quirurgicos);
    drawParagraph('Antecedentes traumaticos', patient?.antecedentes_traumaticos);
    drawParagraph('Antecedentes farmacologicos', patient?.antecedentes_farmacologicos);
    drawParagraph('Antecedentes familiares', patient?.antecedentes_familiares);
    drawParagraph('Antecedentes sociales', patient?.antecedentes_sociales);

    return Buffer.from(await pdfDoc.save());
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

    async exportPdf(id) {
        const history = await HistoryQuote.findByPk(id, {
            include: [
                { model: Cie10, as: 'Cie10' },
                {
                    model: Quotes,
                    as: 'Quotes',
                    include: [
                        {
                            model: Packages,
                            include: [
                                { model: Patient, as: 'patient' },
                                { model: Cie10, as: 'secondaryDiagnosis' }
                            ]
                        }
                    ]
                }
            ]
        });

        if (!history) {
            throw new Error('Historia no encontrada para exportar');
        }

        return buildHistoryPdf(history);
    },

    getByQuote(id_cita) {
        return HistoryQuote.findAll({
            where: { id_cita },
            include: [Cie10]
        });
    }
};
