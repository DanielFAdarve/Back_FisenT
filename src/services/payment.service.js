const { Payment, Quotes, Packages, AttentionPackages, sequelize } = require('../models');

const sumPaymentValues = (rows) => rows.reduce((acc, row) => acc + Number(row.valor || 0), 0);

const getPackagePaymentSummary = async (id_paquete, transaction = null) => {
  const pkg = await Packages.findByPk(id_paquete, {
    include: [{ model: AttentionPackages, as: 'attentionPackage' }],
    transaction
  });

  if (!pkg) {
    throw new Error('Paquete no encontrado');
  }

  const config = pkg.attentionPackage || (await pkg.getAttentionPackage({ transaction }));
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

const createPayment = async (data) => {
  return await sequelize.transaction(async (t) => {
    if (!data.valor || Number(data.valor) <= 0 || !data.metodo_pago) {
      throw new Error('Valor (mayor a 0) y metodo_pago son obligatorios');
    }

    const paymentType = data.tipo ?? (data.id_cita ? 'cita' : 'paquete');

    if (paymentType === 'paquete' && !data.id_paquete) {
      throw new Error('Para pagos de paquete debe enviar id_paquete');
    }

    if (paymentType === 'cita' && !data.id_cita) {
      throw new Error('Para pagos de cita debe enviar id_cita');
    }

    if (data.id_paquete) {
      const summary = await getPackagePaymentSummary(data.id_paquete, t);

      if (summary.total_paquete > 0 && (summary.total_abonado + Number(data.valor)) > summary.total_paquete) {
        throw new Error(`El abono excede el saldo pendiente del paquete (${summary.saldo_pendiente})`);
      }
    }

    const payment = await Payment.create({
      id_paquete: data.id_paquete ?? null,
      id_cita: data.id_cita ?? null,
      valor: data.valor,
      metodo_pago: data.metodo_pago,
      fecha_pago: data.fecha_pago ?? undefined,
      observacion: data.observacion ?? null,
      tipo: paymentType
    }, { transaction: t });

    if (data.id_cita) {
      await Quotes.update(
        { pagado: true },
        { where: { id: data.id_cita }, transaction: t }
      );
    }

    const packageSummary = data.id_paquete
      ? await getPackagePaymentSummary(data.id_paquete, t)
      : null;

    return {
      payment,
      package_summary: packageSummary
    };
  });
};

const getAll = async () => Payment.findAll();

const getById = async (id) => Payment.findByPk(id);

const getPackageSummary = async (id_paquete) => getPackagePaymentSummary(id_paquete);

const updatePayment = async (id, data) => {
  await Payment.update(data, { where: { id } });
  return getById(id);
};

const deletePayment = async (id) =>
  Payment.destroy({ where: { id } });

module.exports = { createPayment, getAll, getById, getPackageSummary, updatePayment, deletePayment };
