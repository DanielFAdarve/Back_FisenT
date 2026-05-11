const { Op } = require('sequelize');
const { Payment, Quotes, Packages, AttentionPackages, sequelize } = require('../models');
const Pagination = require('../models/Pagination.models');

const sumPaymentValues = (rows) =>
  rows.reduce((acc, row) => acc + Number(row.valor || 0), 0);

/**
 * Calcula el resumen de pagos de un paquete
 */
const getPackagePaymentSummary = async (id_paquete, transaction = null) => {
  const pkg = await Packages.findByPk(id_paquete, {
    include: [{ model: AttentionPackages, as: 'attentionPackage' }],
    transaction
  });

  if (!pkg) {
    throw new Error('Paquete no encontrado');
  }

  const config =
    pkg.attentionPackage ||
    (await pkg.getAttentionPackage({ transaction }));

  const totalPaquete = Number(config?.valor || 0);

  const payments = await Payment.findAll({
    where: { id_paquete, tipo: 'paquete' },
    transaction
  });

  const totalAbonado = sumPaymentValues(payments);
  const saldoPendiente = Math.max(totalPaquete - totalAbonado, 0);

  let estadoPago = 'pendiente';
  if (totalPaquete > 0 && totalAbonado >= totalPaquete) {
    estadoPago = 'pagado';
  } else if (totalAbonado > 0) {
    estadoPago = 'abonado';
  }

  return {
    id_paquete,
    total_paquete: totalPaquete,
    total_abonado: totalAbonado,
    saldo_pendiente: saldoPendiente,
    estado_pago: estadoPago,
    cantidad_abonos: payments.length
  };
};

/**
 * Obtiene todos los pagos de un paquete + resumen
 */
const getAllPaymentsForPackage = async (id_paquete, transaction = null) => {
  const summary = await getPackagePaymentSummary(id_paquete, transaction);

  const payments = await Payment.findAll({
    where: { id_paquete, tipo: 'paquete' },
    transaction
  });

  return {
    ...summary,
    pagos: payments
  };
};

/**
 * Crear pago
 */
const createPayment = async (data) => {
  return await sequelize.transaction(async (t) => {
    // 🔴 Validaciones básicas
    if (!data.valor || Number(data.valor) <= 0) {
      throw new Error('El valor debe ser mayor a 0');
    }

    if (!data.metodo_pago) {
      throw new Error('El metodo_pago es obligatorio');
    }

    // 🔴 Determinar tipo
    const paymentType = data.tipo ?? (data.id_cita ? 'cita' : 'paquete');

    // 🔴 Validaciones de coherencia
    if (paymentType === 'paquete' && !data.id_paquete) {
      throw new Error('Para pagos de paquete debe enviar id_paquete');
    }

    if (paymentType === 'cita' && !data.id_cita) {
      throw new Error('Para pagos de cita debe enviar id_cita');
    }

    if (paymentType === 'cita' && data.id_paquete) {
      throw new Error('Un pago de cita no puede tener id_paquete');
    }

    if (paymentType === 'paquete' && data.id_cita) {
      throw new Error('Un pago de paquete no puede tener id_cita');
    }

    // 🔴 Validar sobrepago
    if (data.id_paquete) {
      const summary = await getPackagePaymentSummary(data.id_paquete, t);

      if (
        summary.total_paquete > 0 &&
        summary.total_abonado + Number(data.valor) > summary.total_paquete
      ) {
        throw new Error(
          `El abono excede el saldo pendiente (${summary.saldo_pendiente})`
        );
      }
    }

    // ✅ Crear pago
    const payment = await Payment.create(
      {
        id_paquete: data.id_paquete ?? null,
        id_cita: data.id_cita ?? null,
        valor: Number(data.valor),
        metodo_pago: data.metodo_pago,
        fecha_pago: data.fecha_pago || null,
        observacion: data.observacion ?? null,
        tipo: paymentType
      },
      { transaction: t }
    );

    // ✅ Marcar cita como pagada
    if (data.id_cita) {
      await Quotes.update(
        { pagado: true },
        { where: { id: data.id_cita }, transaction: t }
      );
    }

    // ✅ Retornar resumen actualizado
    const packageSummary = data.id_paquete
      ? await getPackagePaymentSummary(data.id_paquete, t)
      : null;

    return {
      payment,
      package_summary: packageSummary
    };
  });
};

/**
 * CRUD básicos
 */
const getAll = async ({ page = 1, limit = 20, search = '', id_paquete, id_cita } = {}) => {
  const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
  const offset = (normalizedPage - 1) * normalizedLimit;
  const where = {};

  if (id_paquete) where.id_paquete = id_paquete;
  if (id_cita) where.id_cita = id_cita;

  if (search && search.trim() !== '') {
    const value = `%${search.trim()}%`;
    where[Op.or] = [
      { metodo_pago: { [Op.iLike]: value } },
      { tipo: { [Op.iLike]: value } },
      { observacion: { [Op.iLike]: value } }
    ];
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    limit: normalizedLimit,
    offset,
    order: [['fecha_pago', 'DESC']]
  });

  return {
    data: rows,
    pagination: Pagination.set({
      total: count,
      page: normalizedPage,
      limit: normalizedLimit
    })
  };
};

const getById = async (id) => Payment.findByPk(id);

const getPackageSummary = async (id_paquete) =>
  getPackagePaymentSummary(id_paquete);

const getAppointmentSummary = async (id_cita) => {
  const quote = await Quotes.findByPk(id_cita, {
    include: [
      {
        model: Packages,
        as: 'package',
        include: [{ model: AttentionPackages, as: 'attentionPackage' }]
      }
    ]
  });
  if (!quote) {
    throw new Error('Cita no encontrada');
  }

  const payments = await Payment.findAll({
    where: { id_cita, tipo: 'cita' }
  });

  const totalAbonado = sumPaymentValues(payments);
  const packageValue = Number(quote.package?.attentionPackage?.valor || 0);
  const sessionCount = Number(quote.package?.attentionPackage?.cantidad_sesiones || 0);
  const totalCita = sessionCount > 0 ? Math.round(packageValue / sessionCount) : totalAbonado;
  const saldoPendiente = Math.max(totalCita - totalAbonado, 0);

  let estadoPago = 'pendiente';
  if (totalCita > 0 && totalAbonado >= totalCita) {
    estadoPago = 'pagado';
  } else if (totalAbonado > 0) {
    estadoPago = 'abonado';
  } else if (quote.pagado) {
    estadoPago = 'pagado';
  }

  return {
    id_cita,
    total_cita: totalCita,
    total_abonado: totalAbonado,
    saldo_pendiente: saldoPendiente,
    estado_pago: estadoPago,
    cantidad_abonos: payments.length
  };
};

const updatePayment = async (id, data) => {
  await Payment.update(data, { where: { id } });
  return getById(id);
};

const deletePayment = async (id) =>
  Payment.destroy({ where: { id } });

module.exports = {
  createPayment,
  getAll,
  getById,
  getPackageSummary,
  getAppointmentSummary,
  getAllPaymentsForPackage,
  updatePayment,
  deletePayment
};