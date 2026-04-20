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
        include: [{ model: Packages, as: 'package', include: [{ model: Patient, as: 'patient' }] }],
        transaction
    });

    const patient = quote?.package?.patient;
    if (!patient) return;

    await patient.update(payload, { transaction });
};

const buildHistoryPdf = async (history) => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const margin = 40;
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    let y = pageHeight - margin;

    // 🧠 CONTROL DE SALTO DE PÁGINA
    const checkPageBreak = (space = 20) => {
        if (y < margin + space) {
            page = pdfDoc.addPage([595, 842]);
            y = pageHeight - margin;
        }
    };

    // 🧱 TÍTULO
    const drawTitle = (text) => {
        page.drawText(text.toUpperCase(), {
            x: margin,
            y,
            size: 13,
            font: bold
        });
        y -= 22;
    };

    // 📌 LÍNEA SIMPLE
    const drawLine = () => {
        page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7)
        });
        y -= 10;
    };

    // 🧩 DOS COLUMNAS
    const drawTwoColumns = (leftLabel, leftValue, rightLabel, rightValue) => {
        checkPageBreak();

        const colWidth = (pageWidth - margin * 2) / 2;

        page.drawText(`${leftLabel}: ${leftValue || ''}`, {
            x: margin,
            y,
            size: 9,
            font
        });

        page.drawText(`${rightLabel}: ${rightValue || ''}`, {
            x: margin + colWidth,
            y,
            size: 9,
            font
        });

        y -= 14;
    };

    // 🧾 LABEL NORMAL
    const drawLabel = (label, value) => {
        checkPageBreak();

        page.drawText(`${label}: ${value || ''}`, {
            x: margin,
            y,
            size: 9,
            font
        });

        y -= 14;
    };

    // 🧠 PÁRRAFO PROFESIONAL (wrap real)
    const drawParagraph = (title, text) => {
        checkPageBreak(40);

        page.drawText(`${title}:`, {
            x: margin,
            y,
            size: 10,
            font: bold
        });

        y -= 14;

        const words = String(text || 'N/A').split(' ');
        let line = '';

        const maxWidth = pageWidth - margin * 2;

        for (const word of words) {
            const testLine = line + word + ' ';
            const textWidth = font.widthOfTextAtSize(testLine, 9);

            if (textWidth > maxWidth) {
                page.drawText(line, { x: margin, y, size: 9, font });
                y -= 12;
                line = word + ' ';
            } else {
                line = testLine;
            }
        }

        if (line) {
            page.drawText(line, { x: margin, y, size: 9, font });
            y -= 14;
        }

        y -= 6;
    };

    // 🧪 TABLA SIMPLE (para OBJETIVO tipo pruebas)
    const drawTable = (headers, rows) => {
        checkPageBreak(60);

        const colWidth = (pageWidth - margin * 2) / headers.length;

        // headers
        headers.forEach((h, i) => {
            page.drawText(h, {
                x: margin + i * colWidth,
                y,
                size: 9,
                font: bold
            });
        });

        y -= 14;

        // rows
        rows.forEach(row => {
            checkPageBreak();

            row.forEach((cell, i) => {
                page.drawText(String(cell), {
                    x: margin + i * colWidth,
                    y,
                    size: 8,
                    font
                });
            });

            y -= 12;
        });

        y -= 10;
    };

    // ========================
    // 🧾 DATOS
    // ========================
    const quote = history.Quotes;
    const pkg = quote?.Package;
    const patient = pkg?.patient;

    // ========================
    // 🏥 HEADER
    // ========================
    drawTitle('Historia Clínica Fisioterapéutica');
    drawLine();

    drawTwoColumns(
        'Nombre del paciente',
        `${patient?.nombre || ''} ${patient?.apellido || ''}`,
        'Identificación',
        patient?.num_doc
    );

    drawTwoColumns(
        'Fecha',
        history.fecha_evolucion,
        'Edad',
        patient?.edad
    );

    drawTwoColumns(
        'Procedencia',
        patient?.ciudad,
        'Género',
        patient?.genero
    );

    drawLabel('Dirección', patient?.direccion);
    drawTwoColumns('Teléfono', patient?.telefono, 'Ocupación', patient?.ocupacion);
    drawTwoColumns('Régimen', patient?.regimen, 'EPS', patient?.eps);

    drawLabel('Red de apoyo', patient?.red_apoyo);

    drawLine();

    // ========================
    // 🧬 DIAGNÓSTICO
    // ========================
    drawLabel(
        'Diagnóstico médico (CIE-10)',
        history.Cie10
            ? `${history.Cie10.codigo} - ${history.Cie10.descripcion}`
            : ''
    );

    drawLine();

    // ========================
    // 🧾 ANTECEDENTES
    // ========================
    drawTitle('Antecedentes');

    drawLabel('Patológicos', patient?.antecedentes_patologicos);
    drawLabel('Quirúrgicos', patient?.antecedentes_quirurgicos);
    drawLabel('Traumáticos', patient?.antecedentes_traumaticos);
    drawLabel('Farmacológicos', patient?.antecedentes_farmacologicos);
    drawLabel('Familiares', patient?.antecedentes_familiares);
    drawLabel('Sociales', patient?.antecedentes_sociales);

    drawLine();

    // ========================
    // 🧠 EVOLUCIÓN
    // ========================
    drawParagraph('Subjetivo', history.subjetivo);

    // 🔥 Ejemplo de tabla tipo pruebas (si tienes data estructurada)
    if (history.objetivo_tabla) {
        drawTable(
            ['Prueba', 'Descripción', 'Resultado'],
            history.objetivo_tabla
        );
    } else {
        drawParagraph('Objetivo', history.objetivo);
    }

    drawParagraph('Intervención', history.intervencion);
    drawParagraph('Estado del paciente', history.descripcion_estado_paciente);
    drawParagraph('Recomendaciones', history.recomendaciones);

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
    async getHistoryData(id) {
        const history = await HistoryQuote.findByPk(id, {
            include: [
                { model: Cie10, as: 'Cie10' },
                {
                    model: Quotes,
                    as: 'Quotes',
                    include: [
                        {
                            model: Packages,
                            as: "package",
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

        return history;
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
                            as: "package",
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

    async getByQuote(id_cita) {
        return await Quotes.findOne({
            where: { id: id_cita },
            include: [
                {
                    model: HistoryQuote,
                    required: false, // 🔥 CLAVE: LEFT JOIN
                    include: [
                        {
                            model: Cie10,
                            as: 'Cie10'
                        }
                    ]
                },
                {
                    model: Packages,
                    as: 'package',
                    include: [
                        {
                            model: Patient,
                            as: 'patient',
                            attributes: [
                                'tipo_doc',
                                'num_doc',
                                'telefono',
                                'telefono_secundario',
                                'email',
                                'eps',
                                'ocupacion',
                                'modalidad_deportiva',
                                'antecedentes',
                                'antecedentes_personales',
                                'antecedentes_patologicos',
                                'antecedentes_quirurgicos',
                                'antecedentes_traumaticos',
                                'antecedentes_farmacologicos',
                                'antecedentes_familiares',
                                'antecedentes_sociales'
                            ],
                            include: [
                                {
                                    model: Cie10,
                                    as: 'diagnosis',
                                    attributes: ['id', 'codigo', 'descripcion']
                                }
                            ]
                        }
                    ]
                }
            ]
        });
    }
};
