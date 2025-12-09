// const { Payment, Quotes, Packages, sequelize } = require("../models");

// const createPayment = async (data) => {
//   return await sequelize.transaction(async (t) => {

//     const payment = await Payment.create(data, { transaction: t });

//     if (data.id_cita) {
//       await Quotes.update(
//         { pagado: true },
//         { where: { id: data.id_cita }, transaction: t }
//       );
//     }

//     const totalPagadas = await Quotes.count({
//       where: { id_paquetes: data.id_paquete, pagado: true },
//       transaction: t
//     });

//     const pkg = await Packages.findByPk(data.id_paquete, { transaction: t });
//     const config = await pkg.getAttentionPackage();

//     if (totalPagadas >= config.cantidad_sesiones) {
//       await Packages.update(
//         { id_estado_citas: 3 }, // 3 = cerrado
//         { where: { id: data.id_paquete }, transaction: t }
//       );
//     }

//     return payment;
//   });
// };

// const getAll = async () => Payment.findAll();

// const getById = async (id) => Payment.findByPk(id);

// const updatePayment = async (id, data) =>
//   Payment.update(data, { where: { id } });

// const deletePayment = async (id) =>
//   Payment.destroy({ where: { id } });

// module.exports = { createPayment, getAll, getById, updatePayment, deletePayment };

// services/payment.service.js
const { Payment, Quotes, Packages, AttentionPackages, sequelize } = require("../models");

const createPayment = async (data) => {
  // data expected: { id_paquete?, id_cita?, valor, metodo_pago, observacion?, tipo? }
  return await sequelize.transaction(async (t) => {
    // Basic validation
    if (!data.valor || !data.metodo_pago) {
      throw new Error("Valor y metodo_pago son obligatorios");
    }

    // Create payment record
    const payment = await Payment.create({
      id_paquete: data.id_paquete ?? null,
      id_cita: data.id_cita ?? null,
      valor: data.valor,
      metodo_pago: data.metodo_pago,
      fecha_pago: data.fecha_pago ?? undefined,
      observacion: data.observacion ?? null,
      tipo: data.tipo ?? (data.id_cita ? "cita" : "paquete")
    }, { transaction: t });

    // If payment linked to a quote (cita), mark it as pagada
    if (data.id_cita) {
      await Quotes.update(
        { pagado: true },
        { where: { id: data.id_cita }, transaction: t }
      );
    }

    // If payment related to a package, do not blindly change package state,
    // but we can fetch package and, if payments correspond to all sessions, close it.
    if (data.id_paquete) {
      // Load package including its attentionPackage config
      const pkg = await Packages.findByPk(data.id_paquete, {
        include: [{ model: AttentionPackages, as: 'attentionPackage' }],
        transaction: t
      });

      if (!pkg) {
        // No package found — depending on business, might rollback or just continue.
        // Here we choose to continue but warn (throwing would rollback payment).
        // throw new Error('Paquete no encontrado');
      } else {
        // Count the number of quotes for the package that are pagadas (paid)
        const totalPagadas = await Quotes.count({
          where: { id_paquetes: data.id_paquete, pagado: true },
          transaction: t
        });

        // Access configuration safely (alias: attentionPackage)
        const config = pkg.attentionPackage || (await pkg.getAttentionPackage({ transaction: t }));

        if (config && totalPagadas >= config.cantidad_sesiones) {
          // Close package when all sessions paid (business rule — adjust if needed)
          await Packages.update(
            { id_estado_citas: 3 }, // 3 = cerrado
            { where: { id: data.id_paquete }, transaction: t }
          );
        }
      }
    }

    return payment;
  });
};

const getAll = async () => Payment.findAll();

const getById = async (id) => Payment.findByPk(id);

const updatePayment = async (id, data) => {
  await Payment.update(data, { where: { id } });
  return getById(id);
};

const deletePayment = async (id) =>
  Payment.destroy({ where: { id } });

module.exports = { createPayment, getAll, getById, updatePayment, deletePayment };
