const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');

const buildHistoryDocx = async (history) => {
    const content = fs.readFileSync(
        path.join(__dirname, '../templates/Historia.docx'),
        'binary'
    );

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
            start: '[[',
            end: ']]'
        }
    });

    const quote = history.Quotes;
    const pkg = quote?.package;
    const patient = pkg?.patient;

    const calcularEdad = (fecha) => {
        if (!fecha) return '';
        const hoy = new Date();
        const nacimiento = new Date(fecha);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    const data = {
        nombre: `${patient?.nombre || ''} ${patient?.apellido || ''}`,
        documento: patient?.num_doc || '',

        fecha: history.fecha_evolucion || quote?.fecha_agendamiento,
        edad: calcularEdad(patient?.fecha_nacimiento),

        procedencia: patient?.procedencia,
        genero: patient?.genero,

        urbana: patient?.zona === 'U' ? 'X' : '',
        rural: patient?.zona === 'R' ? 'X' : '',

        direccion: patient?.direccion,
        telefono: patient?.telefono,

        ocupacion: patient?.ocupacion,
        regimen: patient?.regimen,
        eps: patient?.eps,

        red_apoyo: patient?.red_apoyo ? 'SI' : 'NO',

        modalidad: patient?.modalidad_deportiva,

        diagnostico: history.Cie10
            ? `${history.Cie10.codigo} - ${history.Cie10.descripcion}`
            : '',

        antecedentes_patologicos: patient?.antecedentes_patologicos,
        antecedentes_quirurgicos: patient?.antecedentes_quirurgicos,
        antecedentes_traumaticos: patient?.antecedentes_traumaticos,
        antecedentes_farmacologicos: patient?.antecedentes_farmacologicos,
        antecedentes_familiares: patient?.antecedentes_familiares,
        antecedentes_sociales: patient?.antecedentes_sociales,

        subjetivo: history.subjetivo,
        objetivo: history.objetivo,
        intervencion: history.intervencion,
        estado: history.descripcion_estado_paciente,
        recomendaciones: history.recomendaciones,
    };

    // 🔥 NUEVA FORMA
    try {
        doc.render(data);
    } catch (error) {
        console.log('❌ Error renderizando DOCX:');
        console.log(JSON.stringify(error, null, 2));
        throw error;
    }

    return doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
    });
};

const convertToPdf = (docxBuffer) => {
    return new Promise((resolve, reject) => {
        libre.convert(docxBuffer, '.pdf', undefined, (err, done) => {
            if (err) return reject(err);
            resolve(done);
        });
    });
};

const escapeXml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const decodeXml = (value) => value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');

const replaceTemplateToken = (xml, token, value) => xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (paragraph) => {
    const text = Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g))
        .map((match) => decodeXml(match[1]))
        .join('');

    if (!text.includes(token)) return paragraph;

    const openingTag = paragraph.match(/^<w:p\b[^>]*>/)?.[0] || '<w:p>';
    const properties = paragraph.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)?.[0] || '';
    const replaced = text.split(token).join(String(value ?? ''));

    return `${openingTag}${properties}<w:r><w:t xml:space="preserve">${escapeXml(replaced)}</w:t></w:r></w:p>`;
});

const valueOrDash = (value, suffix = '') => (value === undefined || value === null || value === '' ? '-' : `${value}${suffix}`);

const formatExerciseGroups = (groups) => {
    if (!Array.isArray(groups) || groups.length === 0) return 'No se registraron ejercicios.';

    return groups.map((group) => {
        const exercises = (group.ejercicios || []).map((exercise) => {
            const dose = `${valueOrDash(exercise.series)} x ${valueOrDash(exercise.repeticiones)}`;
            const load = valueOrDash(exercise.carga_kg, ' kg');
            const observation = exercise.observaciones ? ` (${exercise.observaciones})` : '';
            return `${exercise.ejercicio}: ${dose}, ${load}${observation}`;
        }).join('; ');
        return `${group.grupo}: ${exercises}`;
    }).join(' | ');
};

const formatExerciseField = (groups, formatter) => (groups || []).map((group) => {
    const details = (group.ejercicios || []).map(formatter).filter(Boolean).join(', ');
    return details ? `${group.grupo}: ${details}` : null;
}).filter(Boolean).join(' | ') || '-';

const buildTrainingSessionDocx = async (history) => {
    const content = fs.readFileSync(
        path.join(__dirname, '../templates/Detalle de Sesión_ Ejercicios y Agentes - FISEN THERAPY.docx'),
        'binary'
    );
    const zip = new PizZip(content);
    const groups = history.grupos_ejercicios || [];
    const agents = history.agentes_biofisicos || {};
    const response = history.respuesta_inmediata || {};
    const check = (value) => value ? 'X' : '';

    const data = {
        '#TENS_CONV': check(agents.tens?.convencional),
        '#TENS_BURST': check(agents.tens?.burst),
        '#TENS_FORT': check(agents.tens?.fortalecimiento),
        '#TENS_INTENSIDAD': valueOrDash(agents.tens?.intensidad_ma),
        '#ULTRAS_CON': check(agents.ultrasonido?.continuo),
        '#ULTRAS_PUL': check(agents.ultrasonido?.pulsado),
        '#ULTRAS_POR': valueOrDash(agents.ultrasonido?.porcentaje),
        '#ULTRAS_WCM': valueOrDash(agents.ultrasonido?.w_cm2),
        '#ULTRAS_TIEMPO': valueOrDash(agents.ultrasonido?.tiempo_min),
        '#TERMO_SUP': check(agents.termoterapia?.calor_superficial),
        '#TERMO_CRIO': check(agents.termoterapia?.crioterapia),
        '#TERMO_TIEMPO': valueOrDash(agents.termoterapia?.tiempo_min),
        '#OTROS_LASER': check(agents.otros?.laser),
        '#OTROS_MAGNETO': check(agents.otros?.magneto),
        '#OTROS_ONDA': check(agents.otros?.ondas_choque),
        '#EJERCICIOS_REALIZADOS': formatExerciseGroups(groups),
        '#EJERCICIOS_SERIES': formatExerciseField(groups, (exercise) => (
            `${exercise.ejercicio}: ${valueOrDash(exercise.series)} x ${valueOrDash(exercise.repeticiones)}`
        )),
        '#EJERCICIOS_CARGA': formatExerciseField(groups, (exercise) => (
            `${exercise.ejercicio}: ${valueOrDash(exercise.carga_kg, ' kg')}`
        )),
        '#EJERCICIOS_FAT': check(response.fatiga_controlada),
        '#EJERCICIOS_DOL': check(response.dolor_durante_ejecucion),
        '$EJERCICIOS_DOL': check(response.dolor_durante_ejecucion),
        '#EJERCICIOS_MEJ': check(response.mejora_tecnica)
    };

    let xml = zip.file('word/document.xml').asText();
    for (const [token, value] of Object.entries(data)) {
        xml = replaceTemplateToken(xml, token, value);
    }
    zip.file('word/document.xml', xml);

    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

module.exports = { buildHistoryDocx, buildTrainingSessionDocx, convertToPdf };
