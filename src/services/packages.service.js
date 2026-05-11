const { Op } = require('sequelize');
const { Packages, AttentionPackages, Quotes, Patient, StatusPackages, Professional, Cie10, sequelize } = require('../models');
const Pagination = require('../models/Pagination.models');

module.exports = {

    async create(data) {
        const { id_pacientes, id_paquetes_atenciones, id_profesional, id_cie_secundario } = data;

        // verificar si existe uno activo
        const active = await Packages.findOne({
            where: {
                id_pacientes,
                id_paquetes_atenciones,
                id_estado_citas: 1 // estado "activo"
            }
        });

        if (active) throw new Error('El paciente ya tiene un paquete activo de este tipo.');

        if (id_profesional) {
            const professional = await Professional.findByPk(id_profesional);
            if (!professional) throw new Error('Profesional no encontrado para asignar el paquete');
        }

        if (id_cie_secundario) {
            const cie10 = await Cie10.findByPk(id_cie_secundario);
            if (!cie10) throw new Error('CIE10 secundario no encontrado para el motivo de consulta');
        }

        return await Packages.create(data);
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

        const include = [
            { model: Patient, as: 'patient', attributes: ['id', 'nombre', 'apellido', 'num_doc'] },
            { model: AttentionPackages, as: 'attentionPackage' },
            { model: StatusPackages, as: 'statusPackage' },
            { model: Professional, as: 'professional', attributes: ['id', 'nombre', 'apellido'] },
            { model: Cie10, as: 'secondaryDiagnosis', attributes: ['id', 'codigo', 'descripcion'] },
            { model: Quotes, attributes: ['id', 'fecha_agendamiento', 'numero_sesion', 'id_estado_citas'] }
        ];

        const { rows, count } = await Packages.findAndCountAll({
            where,
            include,
            limit: normalizedLimit,
            offset,
            distinct: true,
            subQuery: false,
            order: [['id', 'DESC']]
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
    async getByPatient(id_pacientes) {
        return await Packages.findAll({
            where: { id_pacientes },
            include: [
                {
                    model: AttentionPackages,
                    as: 'attentionPackage'
                },
                {
                    model: StatusPackages,
                    as: 'statusPackage'
                },
                {
                    model: Professional,
                    as: 'professional'
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis'
                },
                {
                    model: Quotes,
                    attributes: ['id', 'fecha_agendamiento', 'numero_sesion', 'id_estado_citas']
                }
            ]
        });
    },

    async getById(id) {
        return await Packages.findByPk(id, {
            include: [
                {
                    model: Patient,
                    as: 'patient'
                },
                {
                    model: AttentionPackages,
                    as: 'attentionPackage'
                },
                {
                    model: StatusPackages,
                    as: 'statusPackage'
                },
                {
                    model: Professional,
                    as: 'professional'
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis'
                },
                {
                    model: Quotes
                }
            ]
        });
    },

    async close(id) {
        return await Packages.update(
            { id_estado_citas: 3 }, // cerrado
            { where: { id } }
        );
    },

    async checkAndClosePackage(id_paquetes, transaction = null) {
        const t = transaction || await sequelize.transaction();
        const ownTransaction = !transaction;
        try {
            const paquete = await Packages.findByPk(id_paquetes, { include: [{ model: AttentionPackages, as: 'attentionPackage' }], transaction: t });
            if (!paquete) throw new Error('Paquete no encontrado');

            const used = await Quotes.count({ where: { id_paquetes }, transaction: t });

            const config = paquete.attentionPackage || (await paquete.getAttentionPackage({ transaction: t }));

            if (config && used >= config.cantidad_sesiones) {
                await Packages.update({ id_estado_citas: 3 }, { where: { id: id_paquetes }, transaction: t });
            }

            if (ownTransaction) await t.commit();
            return true;
        } catch (err) {
            if (ownTransaction) await t.rollback();
            throw err;
        }
    },

    async getAvailablePackagesByPatient(id_pacientes, quoteId = null) {
        const packages = await Packages.findAll({
            where: { id_pacientes, id_estado_citas: 1 },
            include: [
                {
                    model: AttentionPackages,
                    as: 'attentionPackage',
                    attributes: ['descripcion', 'cantidad_sesiones']
                },
                {
                    model: Professional,
                    as: 'professional',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Cie10,
                    as: 'secondaryDiagnosis',
                    attributes: ['codigo', 'descripcion']
                },
                {
                    model: Quotes,
                    attributes: ['id']
                }
            ]
        });

        return packages
            .map((pkg) => {

                const sesionesTotales = pkg.attentionPackage?.cantidad_sesiones || 0;

                // 🔥 EXCLUIR LA CITA ACTUAL
                const citasFiltradas = quoteId
                    ? pkg.Quotes.filter(q => q.id !== quoteId)
                    : pkg.Quotes;

                const sesionesUsadas = citasFiltradas.length;

                const sesionesDisponibles = Math.max(sesionesTotales - sesionesUsadas, 0);

                return {
                    id_paquete: pkg.id,

                    sesiones_disponibles: sesionesDisponibles,
                    sesiones_totales: sesionesTotales,
                    sesiones_usadas: sesionesUsadas,

                    tipo_paquete: pkg.attentionPackage?.descripcion || null,

                    id_profesional: pkg.professional?.id || null,

                    profesional: pkg.professional
                        ? `${pkg.professional.nombre || ''}`.trim()
                        : null,

                    motivo_secundario: pkg.secondaryDiagnosis
                        ? `${pkg.secondaryDiagnosis.codigo} - ${pkg.secondaryDiagnosis.descripcion}`
                        : null,

                    // 🔥 EXTRA (útil para el front)
                    tiene_cita_actual: pkg.Quotes.some(q => q.id === quoteId)
                };
            })
            .filter((pkg) => pkg.sesiones_disponibles > 0);
    }
};
