const {
    HistoryQuote,
    Cie10,
    Quotes,
    Packages,
    Patient,
    Professional,
    AttentionPackages,
    sequelize
} = require('../models');

const TRAINING_HISTORY_TYPE = 'SESION_ENTRENAMIENTO';
const TRAINING_PACKAGE_NAME = 'SESION ENTRENAMIENTO';

const normalizeName = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const toOptionalNumber = (value, label, { min = null, max = null, integer = false } = {}) => {
    if (value === undefined || value === null || value === '') return null;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) {
        throw new Error(`${label} debe ser un número válido`);
    }
    if (min !== null && parsed < min) throw new Error(`${label} no puede ser menor a ${min}`);
    if (max !== null && parsed > max) throw new Error(`${label} no puede ser mayor a ${max}`);

    return parsed;
};

const cleanText = (value) => {
    if (value === undefined || value === null) return null;
    return String(value).trim() || null;
};

const clipText = (value, maxLength) => (value || '').slice(0, maxLength);

const normalizeGroups = (groups) => {
    if (groups === undefined || groups === null) return [];
    if (!Array.isArray(groups)) throw new Error('grupos_ejercicios debe ser un arreglo');

    return groups.map((group, groupIndex) => {
        if (!isPlainObject(group)) throw new Error(`El grupo de ejercicios ${groupIndex + 1} no es válido`);
        const name = cleanText(group.grupo || group.nombre);
        if (!name) throw new Error(`El grupo de ejercicios ${groupIndex + 1} requiere grupo`);
        if (!Array.isArray(group.ejercicios) || group.ejercicios.length === 0) {
            throw new Error(`El grupo ${name} requiere al menos un ejercicio`);
        }

        return {
            grupo: name,
            ejercicios: group.ejercicios.map((exercise, exerciseIndex) => {
                if (!isPlainObject(exercise)) {
                    throw new Error(`El ejercicio ${exerciseIndex + 1} del grupo ${name} no es válido`);
                }

                const exerciseName = cleanText(exercise.ejercicio || exercise.nombre);
                if (!exerciseName) {
                    throw new Error(`El ejercicio ${exerciseIndex + 1} del grupo ${name} requiere ejercicio`);
                }

                return {
                    ejercicio: exerciseName,
                    series: toOptionalNumber(exercise.series, 'series', { min: 0, integer: true }),
                    repeticiones: toOptionalNumber(exercise.repeticiones, 'repeticiones', { min: 0, integer: true }),
                    carga_kg: toOptionalNumber(exercise.carga_kg, 'carga_kg', { min: 0 }),
                    observaciones: cleanText(exercise.observaciones)
                };
            })
        };
    });
};

const normalizeRecommendations = (recommendations) => {
    if (recommendations === undefined || recommendations === null) return [];
    if (!Array.isArray(recommendations)) throw new Error('recomendaciones_sesion debe ser un arreglo');

    return recommendations
        .map(cleanText)
        .filter(Boolean);
};

const normalizeAgents = (agents) => {
    if (agents === undefined || agents === null) return {};
    if (!isPlainObject(agents)) throw new Error('agentes_biofisicos debe ser un objeto JSON');
    return agents;
};

const getTrainingQuote = async (id_cita, transaction = null) => {
    const quote = await Quotes.findByPk(id_cita, {
        include: [
            {
                model: Packages,
                as: 'package',
                include: [
                    { model: Patient, as: 'patient' },
                    { model: AttentionPackages, as: 'attentionPackage' }
                ]
            },
            { model: Professional, as: 'professional' }
        ],
        transaction
    });

    if (!quote) throw new Error('La cita asociada no existe');
    if (!quote.package?.patient || !quote.package?.attentionPackage) {
        throw new Error('La cita no tiene paquete, paciente o tipo de paquete asociado');
    }
    if (normalizeName(quote.package.attentionPackage.descripcion) !== TRAINING_PACKAGE_NAME) {
        throw new Error('La cita no corresponde al paquete SESION ENTRENAMIENTO');
    }

    return quote;
};

const resolveDiagnosisId = (data, quote) => {
    const id = data.id_cie || quote.package?.id_cie_secundario || quote.package?.patient?.id_cie;
    if (!id) throw new Error('La sesión requiere id_cie o un diagnóstico asociado al paciente/paquete');
    return Number(id);
};

const ensureDiagnosis = async (id_cie, transaction) => {
    const diagnosis = await Cie10.findByPk(id_cie, { transaction });
    if (!diagnosis) throw new Error('El código CIE10 no existe');
};

const buildPayload = (data, quote, id_cie) => {
    const groups = normalizeGroups(data.grupos_ejercicios);
    const recommendations = normalizeRecommendations(data.recomendaciones_sesion);
    const observations = cleanText(data.observaciones_generales);

    const intervention = groups
        .map((group) => `${group.grupo}: ${group.ejercicios.map((exercise) => exercise.ejercicio).join(', ')}`)
        .join(' | ');

    return {
        id_cita: quote.id,
        id_cie,
        fecha_evolucion: data.fecha_evolucion || quote.fecha_agendamiento || new Date().toISOString().slice(0, 10),
        tipo_historia: TRAINING_HISTORY_TYPE,
        objetivo_sesion: cleanText(data.objetivo_sesion),
        grupos_ejercicios: groups,
        agentes_biofisicos: normalizeAgents(data.agentes_biofisicos),
        notas_ejercicios: cleanText(data.notas_ejercicios),
        notas_agentes_biofisicos: cleanText(data.notas_agentes_biofisicos),
        tiempo_total_ejercicio_minutos: toOptionalNumber(
            data.tiempo_total_ejercicio_minutos,
            'tiempo_total_ejercicio_minutos',
            { min: 0, integer: true }
        ),
        carga_total_levantada_kg: toOptionalNumber(data.carga_total_levantada_kg, 'carga_total_levantada_kg', { min: 0 }),
        dolor_pre_sesion: toOptionalNumber(data.dolor_pre_sesion, 'dolor_pre_sesion', { min: 0, max: 10 }),
        dolor_post_sesion: toOptionalNumber(data.dolor_post_sesion, 'dolor_post_sesion', { min: 0, max: 10 }),
        respuesta_inmediata: isPlainObject(data.respuesta_inmediata) ? data.respuesta_inmediata : {},
        recomendaciones_sesion: recommendations,
        observaciones_generales: observations,
        subjetivo: cleanText(data.subjetivo),
        objetivo: cleanText(data.objetivo_sesion) || cleanText(data.objetivo),
        intervencion: cleanText(data.intervencion) || intervention || null,
        descripcion_estado_paciente: clipText(observations || 'Sesión de entrenamiento registrada', 255),
        recomendaciones: clipText(recommendations.join(' | ') || 'Sin recomendaciones registradas', 255)
    };
};

const getTrainingHistory = async (id, transaction = null) => {
    const history = await HistoryQuote.findOne({
        where: { id, tipo_historia: TRAINING_HISTORY_TYPE },
        include: [
            { model: Cie10, as: 'Cie10' },
            {
                model: Quotes,
                as: 'Quotes',
                include: [
                    {
                        model: Packages,
                        as: 'package',
                        include: [
                            { model: Patient, as: 'patient' },
                            { model: AttentionPackages, as: 'attentionPackage' }
                        ]
                    },
                    { model: Professional, as: 'professional' }
                ]
            }
        ],
        transaction
    });

    if (!history) throw new Error('Historia de sesión de entrenamiento no encontrada');
    return history;
};

module.exports = {
    TRAINING_HISTORY_TYPE,

    async create(data) {
        if (!data.id_cita) throw new Error('id_cita es obligatorio');

        return sequelize.transaction(async (transaction) => {
            const quote = await getTrainingQuote(data.id_cita, transaction);
            const existing = await HistoryQuote.findOne({ where: { id_cita: quote.id }, transaction });
            if (existing) throw new Error('La cita ya tiene una historia registrada');

            const id_cie = resolveDiagnosisId(data, quote);
            await ensureDiagnosis(id_cie, transaction);
            const history = await HistoryQuote.create(buildPayload(data, quote, id_cie), { transaction });
            return getTrainingHistory(history.id, transaction);
        });
    },

    async update(id, data) {
        return sequelize.transaction(async (transaction) => {
            const history = await getTrainingHistory(id, transaction);
            if (data.id_cita && Number(data.id_cita) !== Number(history.id_cita)) {
                throw new Error('No se puede cambiar la cita de una sesión de entrenamiento');
            }

            const quote = await getTrainingQuote(history.id_cita, transaction);
            const mergedData = { ...history.toJSON(), ...data };
            const id_cie = resolveDiagnosisId(mergedData, quote);
            await ensureDiagnosis(id_cie, transaction);
            await history.update(buildPayload(mergedData, quote, id_cie), { transaction });
            return getTrainingHistory(history.id, transaction);
        });
    },

    getById: getTrainingHistory
};
