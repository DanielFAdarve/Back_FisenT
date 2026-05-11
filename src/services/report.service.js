const { Op, fn, col, literal } = require('sequelize');
const {
  Patient,
  Packages,
  AttentionPackages,
  Quotes,
  StatusQuotes,
  Professional,
  Payment
} = require('../models');

const VALID_PERIODS = ['week', 'month', 'quarter'];

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const toDateOnly = (date) => date.toISOString().slice(0, 10);

const parseLimit = (value, fallback = 5, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const normalizeThreshold = (value, fallback = 70) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, 100);
};

const getDateRange = ({ period = 'month', startDate, endDate } = {}) => {
  const now = new Date();
  let start;
  let end;

  if (startDate && endDate) {
    start = startOfDay(`${startDate}T00:00:00`);
    end = endOfDay(`${endDate}T00:00:00`);
  } else {
    end = endOfDay(now);
    start = startOfDay(now);

    const normalizedPeriod = VALID_PERIODS.includes(period) ? period : 'month';

    if (normalizedPeriod === 'week') {
      start.setDate(start.getDate() - 6);
    } else if (normalizedPeriod === 'quarter') {
      start.setMonth(start.getMonth() - 2, 1);
    } else {
      start.setDate(1);
    }
  }

  return {
    start,
    end,
    dateOnlyWhere: {
      [Op.between]: [toDateOnly(start), toDateOnly(end)]
    },
    dateTimeWhere: {
      [Op.between]: [start, end]
    }
  };
};

const getStatusKey = (statusName = '') => {
  const value = statusName.toLowerCase();

  if (value.includes('cancel')) return 'cancelled';
  if (value.includes('no') && (value.includes('show') || value.includes('asist'))) return 'noShow';
  if (value.includes('complet') || value.includes('realiz') || value.includes('atendid')) return 'completed';

  return 'scheduled';
};

const getAppointmentStatusDistribution = async (filters = {}) => {
  const range = getDateRange(filters);

  const rows = await Quotes.findAll({
    attributes: [
      [col('status.nombre'), 'statusName'],
      [fn('COUNT', col('Quotes.id')), 'count']
    ],
    include: [
      {
        model: StatusQuotes,
        as: 'status',
        attributes: []
      }
    ],
    where: {
      fecha_agendamiento: range.dateOnlyWhere
    },
    group: ['status.id', 'status.nombre'],
    raw: true
  });

  return rows.reduce(
    (acc, row) => {
      const key = getStatusKey(row.statusName);
      acc[key] += Number(row.count || 0);
      return acc;
    },
    { completed: 0, scheduled: 0, cancelled: 0, noShow: 0 }
  );
};

const getRevenue = async (filters = {}) => {
  const range = getDateRange(filters);

  const monthExpression = fn('to_char', col('fecha_pago'), 'YYYY-MM');

  const rows = await Payment.findAll({
    attributes: [
      [monthExpression, 'month'],
      [fn('COALESCE', fn('SUM', col('valor')), 0), 'amount']
    ],
    where: {
      fecha_pago: range.dateTimeWhere
    },
    group: [monthExpression],
    order: [[literal('month'), 'ASC']],
    raw: true
  });

  return rows.map((row) => ({
    month: row.month,
    amount: Number(row.amount || 0)
  }));
};

const getRevenueByPaymentMethod = async (filters = {}) => {
  const range = getDateRange(filters);

  const rows = await Payment.findAll({
    attributes: [
      ['metodo_pago', 'method'],
      [fn('COALESCE', fn('SUM', col('valor')), 0), 'amount']
    ],
    where: {
      fecha_pago: range.dateTimeWhere
    },
    group: ['metodo_pago'],
    order: [[literal('amount'), 'DESC']],
    raw: true
  });

  return rows.map((row) => ({
    method: row.method,
    amount: Number(row.amount || 0)
  }));
};

const getPackagesByType = async () => {
  const rows = await Packages.findAll({
    attributes: [
      [col('attentionPackage.descripcion'), 'type'],
      [fn('COUNT', col('Packages.id')), 'count']
    ],
    include: [
      {
        model: AttentionPackages,
        as: 'attentionPackage',
        attributes: []
      }
    ],
    group: ['attentionPackage.id', 'attentionPackage.descripcion'],
    order: [[literal('count'), 'DESC']],
    raw: true
  });

  return rows.map((row) => ({
    type: row.type,
    count: Number(row.count || 0)
  }));
};

const getPackagesNearCompletion = async ({ threshold = 70, limit = 5 } = {}) => {
  const normalizedThreshold = normalizeThreshold(threshold);
  const normalizedLimit = parseLimit(limit);

  const packages = await Packages.findAll({
    include: [
      {
        model: AttentionPackages,
        as: 'attentionPackage',
        attributes: ['descripcion', 'cantidad_sesiones']
      },
      {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'nombre', 'apellido']
      },
      {
        model: Quotes,
        attributes: ['id']
      }
    ]
  });

  return packages
    .map((pkg) => {
      const cantidadSesiones = Number(pkg.attentionPackage?.cantidad_sesiones || 0);
      const sesionesRealizadas = Number(pkg.Quotes?.length || 0);
      const completionPercentage = cantidadSesiones > 0
        ? Math.round((sesionesRealizadas / cantidadSesiones) * 100)
        : 0;

      return {
        id: pkg.id,
        nombre: pkg.attentionPackage?.descripcion || `Paquete ${pkg.id}`,
        completionPercentage,
        sesionesRealizadas,
        cantidadSesiones,
        paciente: pkg.patient
          ? {
              id: pkg.patient.id,
              nombres: pkg.patient.nombre,
              apellidos: pkg.patient.apellido
            }
          : null
      };
    })
    .filter((pkg) => pkg.completionPercentage >= normalizedThreshold)
    .sort((a, b) => b.completionPercentage - a.completionPercentage)
    .slice(0, normalizedLimit);
};

const getTopProfessionals = async ({ limit = 5, ...filters } = {}) => {
  const range = getDateRange(filters);
  const normalizedLimit = parseLimit(limit);

  const rows = await Quotes.findAll({
    attributes: [
      [col('professional.id'), 'id'],
      [col('professional.nombre'), 'nombres'],
      [col('professional.apellido'), 'apellidos'],
      [fn('COUNT', col('Quotes.id')), 'appointments']
    ],
    include: [
      {
        model: Professional,
        as: 'professional',
        attributes: []
      }
    ],
    where: {
      fecha_agendamiento: range.dateOnlyWhere
    },
    group: ['professional.id', 'professional.nombre', 'professional.apellido'],
    order: [[literal('appointments'), 'DESC']],
    limit: normalizedLimit,
    raw: true
  });

  return rows.map((row) => ({
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    appointments: Number(row.appointments || 0)
  }));
};

const getRecentPayments = async ({ limit = 5, ...filters } = {}) => {
  const range = getDateRange(filters);
  const normalizedLimit = parseLimit(limit);

  return Payment.findAll({
    where: {
      fecha_pago: range.dateTimeWhere
    },
    attributes: ['id', 'tipo', 'valor', 'metodo_pago', 'fecha_pago'],
    order: [['fecha_pago', 'DESC']],
    limit: normalizedLimit
  });
};

const getSessionsSummary = async (filters = {}) => {
  const range = getDateRange(filters);

  const completed = await Quotes.count({
    where: {
      fecha_agendamiento: range.dateOnlyWhere
    }
  });

  const packages = await Packages.findAll({
    include: [
      {
        model: AttentionPackages,
        as: 'attentionPackage',
        attributes: ['cantidad_sesiones']
      },
      {
        model: Quotes,
        attributes: ['id']
      }
    ]
  });

  const total = packages.reduce(
    (acc, pkg) => acc + Number(pkg.attentionPackage?.cantidad_sesiones || 0),
    0
  );
  const pending = Math.max(total - completed, 0);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    completed,
    pending,
    total,
    completionRate
  };
};

const getPatientsSummary = async () => {
  const active = await Patient.count({ where: { estado: true } });
  const inactive = await Patient.count({ where: { estado: false } });

  return {
    active,
    inactive,
    total: active + inactive
  };
};

const getDashboard = async (filters = {}) => {
  const [
    patients,
    appointments,
    sessions,
    revenueByMonth,
    revenueByPaymentMethod,
    packagesByType,
    packagesNearCompletion,
    topProfessionals,
    recentPayments
  ] = await Promise.all([
    getPatientsSummary(filters),
    getAppointmentStatusDistribution(filters),
    getSessionsSummary(filters),
    getRevenue(filters),
    getRevenueByPaymentMethod(filters),
    getPackagesByType(filters),
    getPackagesNearCompletion({ ...filters, threshold: filters.threshold || 70, limit: filters.limit || 5 }),
    getTopProfessionals({ ...filters, limit: filters.limit || 5 }),
    getRecentPayments({ ...filters, limit: filters.limit || 5 })
  ]);

  const appointmentTotal = Object.values(appointments).reduce((acc, value) => acc + value, 0);
  const attendanceRate = appointmentTotal > 0
    ? Math.round((appointments.completed / appointmentTotal) * 100)
    : 0;
  const revenueTotal = revenueByMonth.reduce((acc, item) => acc + item.amount, 0);

  return {
    patients,
    appointments: {
      ...appointments,
      attendanceRate
    },
    sessions,
    revenue: {
      total: revenueTotal,
      byMonth: revenueByMonth,
      byPaymentMethod: revenueByPaymentMethod
    },
    packages: {
      total: await Packages.count(),
      byType: packagesByType,
      nearCompletion: packagesNearCompletion
    },
    professionals: {
      top: topProfessionals
    },
    recentPayments
  };
};

module.exports = {
  getDashboard,
  getRevenue,
  getAppointmentStatusDistribution,
  getTopProfessionals,
  getPackagesByType,
  getPackagesNearCompletion,
  getRecentPayments,
  getSessionsSummary
};
