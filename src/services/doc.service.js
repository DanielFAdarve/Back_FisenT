const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');


// const buildHistoryDocx = async (history) => {
//     const fs = require('fs');
//     const path = require('path');
//     const PizZip = require('pizzip');
//     const Docxtemplater = require('docxtemplater');

//     const content = fs.readFileSync(
//         path.join(__dirname, '../templates/Historia.docx'),
//         'binary'
//     );

//     const zip = new PizZip(content);

//     const doc = new Docxtemplater(zip, {
//         paragraphLoop: true,
//         linebreaks: true,
//         delimiters: {
//             start: '[[',
//             end: ']]'
//         }
//     });

//     const quote = history.Quotes;
//     const pkg = quote?.Package;
//     const patient = pkg?.patient;

//     // 🔥 calcular edad real
//     const calcularEdad = (fecha) => {
//         if (!fecha) return '';
//         const hoy = new Date();
//         const nacimiento = new Date(fecha);
//         let edad = hoy.getFullYear() - nacimiento.getFullYear();
//         const m = hoy.getMonth() - nacimiento.getMonth();
//         if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
//             edad--;
//         }
//         return edad;
//     };

//     doc.setData({
//         nombre: `${patient?.nombre || ''} ${patient?.apellido || ''}`,
//         documento: patient?.num_doc || '',

//         fecha: history.fecha_evolucion || quote?.fecha_agendamiento,
//         edad: calcularEdad(patient?.fecha_nacimiento),

//         procedencia: patient?.procedencia,
//         genero: patient?.genero,

//         // 🔥 checkboxes simulados
//         urbana: patient?.zona === 'U' ? 'X' : '',
//         rural: patient?.zona === 'R' ? 'X' : '',

//         direccion: patient?.direccion,
//         telefono: patient?.telefono,

//         ocupacion: patient?.ocupacion,
//         regimen: patient?.regimen,
//         eps: patient?.eps,

//         red_apoyo: patient?.red_apoyo ? 'SI' : 'NO',

//         modalidad: patient?.modalidad_deportiva,

//         diagnostico: history.Cie10
//             ? `${history.Cie10.codigo} - ${history.Cie10.descripcion}`
//             : '',

//         antecedentes_patologicos: patient?.antecedentes_patologicos,
//         antecedentes_quirurgicos: patient?.antecedentes_quirurgicos,
//         antecedentes_traumaticos: patient?.antecedentes_traumaticos,
//         antecedentes_farmacologicos: patient?.antecedentes_farmacologicos,
//         antecedentes_familiares: patient?.antecedentes_familiares,
//         antecedentes_sociales: patient?.antecedentes_sociales,

//         subjetivo: history.subjetivo,
//         objetivo: history.objetivo,
//         intervencion: history.intervencion,
//         estado: history.descripcion_estado_paciente,
//         recomendaciones: history.recomendaciones,
//     });

//     doc.render();

//     return doc.getZip().generate({
//         type: 'nodebuffer',
//         compression: 'DEFLATE',
//     });
// };
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
module.exports = { buildHistoryDocx, convertToPdf };