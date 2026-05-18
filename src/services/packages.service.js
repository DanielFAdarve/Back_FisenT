const { Op } = require('sequelize');
const { Packages, AttentionPackages, Quotes, Patient, StatusPackages, Professional, Cie10, StatusQuotes, sequelize } = require('../models');
const Pagination = require('../models/Pagination.models');
const { isSessionConsumingStatusName, getNonConsumingQuoteStatusIds, buildConsumingQuoteWhere } = require('../utils/quoteSessionStatus.util');

const PACKAGE_STATUS = {
    ACTIVE: 1,
    CLOSED: 3
};

const PACKAGE_INCLUDE = [
    { model: Patient, as: 'patient', attributes: ['id', 'nombre', 'apellido', 'num_doc'] },
    { model: AttentionPackages, as: 'attentionPackage' },
    { model: StatusPackages, as: 'statusPackage' },
    { model: Professional, as: 'professional', attributes: ['id', 'nombre', 'apellido'] },
    { model: Cie10, as: 'secondaryDiagnosis', attributes: ['id', 'codigo', 'descripcion'] },
    {
        model: Quotes,
        attributes: ['id', 'fecha_agendamiento', 'horario_inicio', 'horario_fin', 'numero_sesion', 'id_estado_citas'],
        include: [{ model: StatusQuotes, as: 'status', attributes: ['id', 'nombre'] }]
    }
];

const getPackageUsage = (pkg) => {
    const totalSessions = Number(pkg.attentionPackage?.cantidad_sesiones || 0);
    const usedSessions = Array.isArray(pkg.Quotes)
        ? pkg.Quotes.filter((quote) => isSessionConsumingStatusName(quote.status?.nombre)).length
        : 0;

    return {
        sesiones_totales: totalSessions,
        sesiones_usadas: usedSessions,
        sesiones_disponibles: Math.max(totalSessions - usedSessions, 0),
        completo: totalSessions > 0 && usedSessions >= totalSessions
    };
};

const hydratePackage = async (id, transaction = null) => {
    const pkg = await Packages.findByPk(id, {
        include: PACKAGE_INCLUDE,
        transaction
    });

    if (!pkg) return null;

    const plain = pkg.toJSON();
    plain.resumen_sesiones = getPackageUsage(plain);
    return plain;
};

const recalculatePackageStatus = async (id_paquetes, transaction = null) => {
    if (!id_paquetes) return null;

    const pkg = await Packages.findByPk(id_paquetes, {
        include: [{ model: AttentionPackages, as: 'attentionPackage' }],
        transaction
    });

    if (!pkg) throw new Error('Paquete no encontrado');

    const nonConsumingStatusIds = await getNonConsumingQuoteStatusIds(StatusQuotes, transaction);
    const used = await Quotes.count({
        where: {
            id_paquetes,
            ...buildConsumingQuoteWhere(nonConsumingStatusIds)
        },
        transaction
    });
    const total = Number(pkg.attentionPackage?.cantidad_sesiones || 0);
    const nextStatus = total > 0 && used >= total ? PACKAGE_STATUS.CLOSED : PACKAGE_STATUS.ACTIVE;

    if (pkg.id_estado_citas !== nextStatus) {
        await pkg.update({ id_estado_citas: nextStatus }, { transaction });
    }

    return {
        id_paquete: pkg.id,
        id_estado_citas: nextStatus,
        sesiones_totales: total,
        sesiones_usadas: used,
        sesiones_disponibles: Math.max(total - used, 0),
        completo: total > 0 && used >= total
    };
};

module.exports = {
    PACKAGE_STATUS,
    hydratePackage,
    recalculatePackageStatus,

    async create(data) {
        const { id_pacientes, id_paquetes_atenciones, id_profesional, id_cie_secundario } = data;

        if (!id_pacientes || !id_paquetes_atenciones) {
            throw new Error('id_pacientes e id_paquetes_atenciones son obligatorios');
        }

        return sequelize.transaction(async (t) => {
            const patient = await Patient.findByPk(id_pacientes, { transaction: t });
            if (!patient) throw new Error('Paciente no encontrado para asignar el paquete');

            const attentionPackage = await AttentionPackages.findByPk(id_paquetes_atenciones, { transaction: t });
            if (!attentionPackage) throw new Error('Tipo de paquete no encontrado');

            const active = await Packages.findOne({
                where: {
                    id_pacientes,
                    id_paquetes_atenciones,
                    id_estado_citas: PACKAGE_STATUS.ACTIVE
                },
                transaction: t
            });

            if (active) {
                const err = new Error('El paciente ya tiene un paquete activo de este tipo.');
                err.existingPackage = await hydratePackage(active.id, t);
                throw err;
            }

            if (id_profesional) {
                const professional = await Professional.findByPk(id_profesional, { transaction: t });
                if (!professional) throw new Error('Profesional no encontrado para asignar el paquete');
            }

            if (id_cie_secundario) {
                const cie10 = await Cie10.findByPk(id_cie_secundario, { transaction: t });
                if (!cie10) throw new Error('CIE10 secundario no encontrado para el motivo de consulta');
            }

            const pkg = await Packages.create({
                ...data,
                id_estado_citas: data.id_estado_citas || PACKAGE_STATUS.ACTIVE
            }, { transaction: t });

            return hydratePackage(pkg.id, t);
        });
    },

    async getAll({ page = 1, limit = 20, search = '' } = {}) {
        const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
        const offset = (normalizedPage - 1) * normalizedLimit;
        const where = {};

        if (search && search.trim() !== '') {
            where.descripcion = { [Op.iLike]: `%${search.trim()}%` };
        }

        const { rows, count } = await AttentionPackages.findAndCountAll({
            where,
            limit: normalizedLimit,
            offset,
            order: [['descripcion', 'ASC']]
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

    async getAssigned({ page = 1, limit = 20, search = '', id_paciente, id_profesional, id_estado_citas } = {}) {
        const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
        const offset = (normalizedPage - 1) * normalizedLimit;
        const where = {};

        if (id_paciente) where.id_pacientes = id_paciente;
        if (id_profesional) where.id_profesional = id_profesional;
        if (id_estado_citas) where.id_estado_citas = id_estado_citas;

        if (search && search.trim() !== '') {
            const value = `%${search.trim()}%`;
            where[Op.or] = [
                { '$patient.nombre$': { [Op.iLike]: value } },
                { '$patient.apellido$': { [Op.iLike]: value } },
                { '$patient.num_doc$': { [Op.iLike]: value } },
                { '$attentionPackage.descripcion$': { [Op.iLike]: value } },
                { '$professional.nombre$': { [Op.iLike]: value } },
                { '$professional.apellido$': { [Op.iLike]: value } }
            ];
        }

        const { rows, count } = await Packages.findAndCountAll({
            where,
            include: PACKAGE_INCLUDE,
            limit: normalizedLimit,
            offset,
            distinct: true,
            subQuery: false,
            order: [['id', 'DESC']]
        });

        return {
            data: rows.map((pkg) => {
                const plain = pkg.toJSON();
                plain.resumen_sesiones = getPackageUsage(plain);
                return plain;
            }),
            pagination: Pagination.set({
                total: count,
                page: normalizedPage,
                limit: normalizedLimit
            })
        };
    },

    async getByPatient(id_pacientes, { page = 1, limit = 20, fechaInicio, fechaFin } = {}) {
        const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
        const offset = (normalizedPage - 1) * normalizedLimit;
        const quoteDateWhere = {};

        if (fechaInicio && fechaFin) {
            quoteDateWhere.fecha_agendamiento = { [Op.between]: [fechaInicio, fechaFin] };
        } else if (fechaInicio) {
            quoteDateWhere.fecha_agendamiento = { [Op.gte]: fechaInicio };
        } else if (fechaFin) {
            quoteDateWhere.fecha_agendamiento = { [Op.lte]: fechaFin };
        }

        const include = PACKAGE_INCLUDE.map((item) => {
            if (item.model !== Quotes) return item;

            return {
                ...item,
                required: Boolean(fechaInicio || fechaFin),
                where: quoteDateWhere
            };
        });

        const { rows, count } = await Packages.findAndCountAll({
            where: { id_pacientes },
            include,
            limit: normalizedLimit,
            offset,
            distinct: true,
            subQuery: false,
            order: [['id', 'DESC']]
        });

        return {
            data: rows.map((pkg) => {
                const plain = pkg.toJSON();
                plain.resumen_sesiones = getPackageUsage(plain);
                return plain;
            }),
            pagination: Pagination.set({
                total: count,
                page: normalizedPage,
                limit: normalizedLimit
            })
        };
    },

    async getById(id) {
        return hydratePackage(id);
    },

    async close(id) {
        return sequelize.transaction(async (t) => {
            const pkg = await Packages.findByPk(id, { transaction: t });
            if (!pkg) throw new Error('Paquete no encontrado');

            await pkg.update({ id_estado_citas: PACKAGE_STATUS.CLOSED }, { transaction: t });
            return hydratePackage(id, t);
        });
    },

    async checkAndClosePackage(id_paquetes, transaction = null) {
        const ownTransaction = !transaction;
        const t = transaction || await sequelize.transaction();

        try {
            const result = await recalculatePackageStatus(id_paquetes, t);
            if (ownTransaction) await t.commit();
            return result;
        } catch (err) {
            if (ownTransaction) await t.rollback();
            throw err;
        }
    },

    async getAvailablePackagesByPatient(id_pacientes, quoteId = null) {
        const packages = await Packages.findAll({
            where: { id_pacientes, id_estado_citas: PACKAGE_STATUS.ACTIVE },
            include: [
                {
                    model: AttentionPackages,
                    as: 'attentionPackage',
                    attributes: ['id', 'descripcion', 'cantidad_sesiones']
                },
                {
                    model: Professional,
                    as: 'professional',
                    attributes: ['id', 'nombre', 'apellido']
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis',
                    attributes: ['id', 'codigo', 'descripcion']
                },
                {
                    model: Quotes,
                    attributes: ['id', 'id_estado_citas'],
                    include: [{ model: StatusQuotes, as: 'status', attributes: ['id', 'nombre'] }]
                }
            ],
            order: [['id', 'DESC']]
        });

        return packages
            .map((pkg) => {
                const sesionesTotales = Number(pkg.attentionPackage?.cantidad_sesiones || 0);
                const citas = pkg.Quotes || [];
                const citasFiltradas = quoteId
                    ? citas.filter(q => Number(q.id) !== Number(quoteId))
                    : citas;
                const sesionesUsadas = citasFiltradas.filter((quote) => isSessionConsumingStatusName(quote.status?.nombre)).length;
                const sesionesDisponibles = Math.max(sesionesTotales - sesionesUsadas, 0);

                return {
                    id_paquete: pkg.id,
                    sesiones_disponibles: sesionesDisponibles,
                    sesiones_totales: sesionesTotales,
                    sesiones_usadas: sesionesUsadas,
                    tipo_paquete: pkg.attentionPackage?.descripcion || null,
                    id_tipo_paquete: pkg.attentionPackage?.id || null,
                    id_profesional: pkg.professional?.id || null,
                    profesional: pkg.professional
                        ? `${pkg.professional.nombre || ''} ${pkg.professional.apellido || ''}`.trim()
                        : null,
                    id_cie_secundario: pkg.secondaryDiagnosis?.id || null,
                    motivo_secundario: pkg.secondaryDiagnosis
                        ? `${pkg.secondaryDiagnosis.codigo} - ${pkg.secondaryDiagnosis.descripcion}`
                        : null,
                    tiene_cita_actual: citas.some(q => Number(q.id) === Number(quoteId))
                };
            })
            .filter((pkg) => pkg.sesiones_disponibles > 0 || pkg.tiene_cita_actual);
    }
};
