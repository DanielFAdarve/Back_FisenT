const { Op } = require('sequelize');
const { Quotes, Packages, AttentionPackages, Patient, Professional, StatusQuotes, HistoryQuote, Cie10, sequelize } = require('../models');
const Pagination = require('../models/Pagination.models');
const packagesService = require('./packages.service');
const { getNonConsumingQuoteStatusIds, buildConsumingQuoteWhere } = require('../utils/quoteSessionStatus.util');

const QUOTE_INCLUDE = [
    {
        model: Packages,
        as: 'package',
        include: [
            {
                model: Patient,
                as: 'patient',
                attributes: ['id', 'nombre', 'apellido', 'num_doc']
            },
            {
                model: AttentionPackages,
                as: 'attentionPackage',
                attributes: ['id', 'descripcion', 'cantidad_sesiones', 'valor']
            }
        ]
    },
    {
        model: Professional,
        as: 'professional',
        attributes: ['id', 'nombre', 'apellido']
    },
    {
        model: StatusQuotes,
        as: 'status',
        attributes: ['id', 'nombre']
    },
    {
        model: HistoryQuote,
        attributes: ['id', 'fecha_evolucion', 'id_cie'],
        required: false,
        include: [{ model: Cie10, as: 'Cie10', attributes: ['id', 'codigo', 'descripcion'] }]
    }
];

const toMinutes = (value) => {
    if (!value) return null;
    const [hours, minutes] = String(value).split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    return hours * 60 + minutes;
};

const hasTimeCollision = (candidate, existing) => {
    const startNew = toMinutes(candidate.horario_inicio);
    const endNew = toMinutes(candidate.horario_fin);
    const startExisting = toMinutes(existing.horario_inicio);
    const endExisting = toMinutes(existing.horario_fin);

    if (startNew === null || endNew === null || startExisting === null || endExisting === null) return false;
    return startNew < endExisting && startExisting < endNew;
};

const ensureProfessionalAvailability = async ({ id_profesional, fecha_agendamiento, horario_inicio, horario_fin, excludeQuoteId = null, transaction = null }) => {
    if (!id_profesional || !fecha_agendamiento || !horario_inicio || !horario_fin) return;

    const existing = await Quotes.findAll({
        where: {
            id_profesional,
            fecha_agendamiento,
            ...(excludeQuoteId ? { id: { [Op.ne]: excludeQuoteId } } : {})
        },
        transaction
    });

    const collision = existing.some((q) => hasTimeCollision({ horario_inicio, horario_fin }, q));
    if (collision) throw new Error('La cita colisiona con otra cita del profesional');
};

const validateQuotePayload = async ({ data, currentQuote = null, transaction = null }) => {
    const payload = {
        ...(currentQuote ? currentQuote.toJSON() : {}),
        ...data
    };

    if (!payload.fecha_agendamiento) throw new Error('La fecha de agendamiento es obligatoria');
    if (!payload.horario_inicio) throw new Error('La hora de inicio es obligatoria');
    if (!payload.id_profesional && !payload.id_paquetes) throw new Error('Debe indicar un profesional o un paquete asociado');

    if (payload.id_profesional) {
        const professional = await Professional.findByPk(payload.id_profesional, { transaction });
        if (!professional) throw new Error('Profesional no encontrado');
    }

    let packageSummary = null;

    if (payload.id_paquetes) {
        const paquete = await Packages.findByPk(payload.id_paquetes, {
            include: [{ model: AttentionPackages, as: 'attentionPackage' }],
            transaction
        });

        if (!paquete) throw new Error('Paquete no encontrado');

        const editingSamePackage = currentQuote && Number(currentQuote.id_paquetes) === Number(payload.id_paquetes);
        if (paquete.id_estado_citas !== packagesService.PACKAGE_STATUS.ACTIVE && !editingSamePackage) {
            throw new Error('El paquete no está activo');
        }

        if (!payload.id_profesional && paquete.id_profesional) {
            payload.id_profesional = paquete.id_profesional;
        }

        if (!payload.id_profesional) {
            throw new Error('Debe indicar un profesional para agendar la cita');
        }

        const nonConsumingStatusIds = await getNonConsumingQuoteStatusIds(StatusQuotes, transaction);
        const used = await Quotes.count({
            where: {
                id_paquetes: payload.id_paquetes,
                ...buildConsumingQuoteWhere(nonConsumingStatusIds),
                ...(currentQuote ? { id: { [Op.ne]: currentQuote.id } } : {})
            },
            transaction
        });
        const total = Number(paquete.attentionPackage?.cantidad_sesiones || 0);

        if (total <= 0) throw new Error('Configuración del paquete no encontrada o sin sesiones configuradas');
        if (used >= total) throw new Error('No hay sesiones disponibles en el paquete');

        payload.numero_sesion = editingSamePackage && payload.numero_sesion ? payload.numero_sesion : used + 1;
        packageSummary = {
            id_paquete: paquete.id,
            sesiones_totales: total,
            sesiones_usadas: used,
            sesiones_disponibles: Math.max(total - used, 0),
            numero_sesion_asignada: payload.numero_sesion
        };
    }

    await ensureProfessionalAvailability({
        id_profesional: payload.id_profesional,
        fecha_agendamiento: payload.fecha_agendamiento,
        horario_inicio: payload.horario_inicio,
        horario_fin: payload.horario_fin,
        excludeQuoteId: currentQuote?.id || null,
        transaction
    });

    return { payload, packageSummary };
};

const getQuoteDetail = async (id, transaction = null) => {
    const quote = await Quotes.findByPk(id, { include: QUOTE_INCLUDE, transaction });
    if (!quote) return null;

    const plain = quote.toJSON();
    const total = Number(plain.package?.attentionPackage?.cantidad_sesiones || 0);
    let packageQuotesCount = 0;
    if (plain.id_paquetes) {
        const nonConsumingStatusIds = await getNonConsumingQuoteStatusIds(StatusQuotes, transaction);
        packageQuotesCount = await Quotes.count({
            where: {
                id_paquetes: plain.id_paquetes,
                ...buildConsumingQuoteWhere(nonConsumingStatusIds)
            },
            transaction
        });
    }

    plain.agendamiento = {
        id_cita: plain.id,
        id_paquete: plain.id_paquetes,
        id_paciente: plain.package?.patient?.id || null,
        id_profesional: plain.id_profesional,
        fecha: plain.fecha_agendamiento,
        hora_inicio: plain.horario_inicio,
        hora_fin: plain.horario_fin,
        numero_sesion: plain.numero_sesion,
        sesiones_totales_paquete: total,
        sesiones_usadas_paquete: packageQuotesCount,
        sesiones_disponibles_paquete: Math.max(total - packageQuotesCount, 0),
        paquete_completo: total > 0 && packageQuotesCount >= total,
        tiene_historia: Array.isArray(plain.HistoryQuotes) && plain.HistoryQuotes.length > 0,
        id_historial: Array.isArray(plain.HistoryQuotes) && plain.HistoryQuotes[0] ? plain.HistoryQuotes[0].id : null
    };

    return plain;
};

const recalculateSessionNumbers = async (id_paquetes, transaction = null) => {
    if (!id_paquetes) return;

    const nonConsumingStatusIds = await getNonConsumingQuoteStatusIds(StatusQuotes, transaction);
    const quotes = await Quotes.findAll({
        where: {
            id_paquetes,
            ...buildConsumingQuoteWhere(nonConsumingStatusIds)
        },
        order: [['fecha_agendamiento', 'ASC'], ['horario_inicio', 'ASC'], ['id', 'ASC']],
        transaction
    });

    for (let index = 0; index < quotes.length; index += 1) {
        const nextNumber = index + 1;
        if (quotes[index].numero_sesion !== nextNumber) {
            await quotes[index].update({ numero_sesion: nextNumber }, { transaction });
        }
    }
};

module.exports = {
    async create(data) {
        return sequelize.transaction(async (t) => {
            const { payload } = await validateQuotePayload({ data, transaction: t });
            const quote = await Quotes.create(payload, { transaction: t });

            await recalculateSessionNumbers(quote.id_paquetes, t);
            const packageSummary = await packagesService.recalculatePackageStatus(quote.id_paquetes, t);
            const detail = await getQuoteDetail(quote.id, t);

            return {
                cita: detail,
                agendamiento: detail.agendamiento,
                paquete: packageSummary
            };
        });
    },

    async getAll({
        page = 1,
        limit = 20,
        search = '',
        fecha,
        fechaInicio,
        fechaFin,
        id_profesional,
        id_paciente
    } = {}) {
        const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
        const offset = (normalizedPage - 1) * normalizedLimit;
        const where = {};
        const packageWhere = {};

        if (fecha) {
            where.fecha_agendamiento = fecha;
        } else if (fechaInicio && fechaFin) {
            where.fecha_agendamiento = { [Op.between]: [fechaInicio, fechaFin] };
        }

        if (id_profesional) where.id_profesional = id_profesional;
        if (id_paciente) packageWhere.id_pacientes = id_paciente;

        if (search && search.trim() !== '') {
            const value = `%${search.trim()}%`;
            where[Op.or] = [
                { motivo: { [Op.iLike]: value } },
                { '$professional.nombre$': { [Op.iLike]: value } },
                { '$professional.apellido$': { [Op.iLike]: value } },
                { '$package.patient.nombre$': { [Op.iLike]: value } },
                { '$package.patient.apellido$': { [Op.iLike]: value } },
                { '$package.patient.num_doc$': { [Op.iLike]: value } }
            ];
        }

        const include = [
            {
                model: Packages,
                as: 'package',
                required: Boolean(id_paciente),
                where: packageWhere,
                include: [
                    {
                        model: Patient,
                        as: 'patient',
                        attributes: ['id', 'nombre', 'apellido', 'num_doc']
                    },
                    {
                        model: AttentionPackages,
                        as: 'attentionPackage',
                        attributes: ['id', 'descripcion', 'cantidad_sesiones']
                    }
                ]
            },
            {
                model: Professional,
                as: 'professional',
                attributes: ['id', 'nombre', 'apellido']
            },
            {
                model: StatusQuotes,
                as: 'status',
                attributes: ['id', 'nombre']
            },
            {
                model: HistoryQuote,
                attributes: ['id'],
                required: false
            }
        ];

        const { rows, count } = await Quotes.findAndCountAll({
            where,
            include,
            limit: normalizedLimit,
            offset,
            distinct: true,
            subQuery: false,
            order: [['fecha_agendamiento', 'DESC'], ['horario_inicio', 'ASC']]
        });

        return {
            data: rows,
            pagination: Pagination.set({
                total: count,
                page: normalizedPage,
                limit: normalizedLimit
            })
        };
    },

    async getById(id) {
        return getQuoteDetail(id);
    },

    async getAllAttentionPackages() {
        return AttentionPackages.findAll();
    },

    async getByPackage(id_paquetes) {
        return Quotes.findAll({
            where: { id_paquetes },
            include: QUOTE_INCLUDE,
            order: [['numero_sesion', 'ASC'], ['fecha_agendamiento', 'ASC'], ['horario_inicio', 'ASC']]
        });
    },

    async getAvailability(id_profesional, fecha) {
        return Quotes.findAll({
            where: { id_profesional, fecha_agendamiento: fecha },
            include: [
                { model: StatusQuotes, as: 'status', attributes: ['id', 'nombre'] },
                { model: Packages, as: 'package', include: [{ model: Patient, as: 'patient', attributes: ['id', 'nombre', 'apellido'] }] }
            ],
            order: [['horario_inicio', 'ASC']]
        });
    },

    async delete(id) {
        return sequelize.transaction(async (t) => {
            const quote = await Quotes.findByPk(id, { transaction: t });
            if (!quote) throw new Error('Cita no encontrada');

            const packageId = quote.id_paquetes;
            await HistoryQuote.destroy({ where: { id_cita: id }, transaction: t });
            await quote.destroy({ transaction: t });
            await recalculateSessionNumbers(packageId, t);
            return packagesService.recalculatePackageStatus(packageId, t);
        });
    },

    async update(id, data) {
        return sequelize.transaction(async (t) => {
            const quote = await Quotes.findByPk(id, { transaction: t });
            if (!quote) throw new Error('Cita no encontrada');

            const previousPackageId = quote.id_paquetes;
            const { payload } = await validateQuotePayload({ data, currentQuote: quote, transaction: t });

            await quote.update(payload, { transaction: t });

            const currentPackageId = payload.id_paquetes;
            await recalculateSessionNumbers(previousPackageId, t);
            if (Number(previousPackageId) !== Number(currentPackageId)) {
                await recalculateSessionNumbers(currentPackageId, t);
                await packagesService.recalculatePackageStatus(previousPackageId, t);
            }
            const packageSummary = await packagesService.recalculatePackageStatus(currentPackageId, t);
            const detail = await getQuoteDetail(id, t);

            return {
                cita: detail,
                agendamiento: detail.agendamiento,
                paquete: packageSummary
            };
        });
    }
};
