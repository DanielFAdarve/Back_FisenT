const { Op } = require('sequelize');
const { Cie10 } = require('../models');
const Pagination = require('../models/Pagination.models');

const normalizeCode = (value) => String(value || '').trim().toUpperCase();

const create = async (data) => {
  const codigo = normalizeCode(data.codigo);
  const descripcion = String(data.descripcion || '').trim();

  if (!codigo || !descripcion) {
    throw new Error('codigo y descripcion son obligatorios');
  }

  const existing = await Cie10.findOne({ where: { codigo } });
  if (existing) {
    throw new Error('El código CIE10 ya existe');
  }

  return Cie10.create({ codigo, descripcion });
};

const getAll = async ({ q, codigo, page = 1, limit = 20 } = {}) => {
  const where = {};

  if (codigo) {
    where.codigo = normalizeCode(codigo);
  }

  if (q) {
    where[Op.or] = [
      { codigo: { [Op.iLike]: `%${q.trim()}%` } },
      { descripcion: { [Op.iLike]: `%${q.trim()}%` } }
    ];
  }

  const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
  const offset = (normalizedPage - 1) * normalizedLimit;

  const { rows, count } = await Cie10.findAndCountAll({
    where,
    limit: normalizedLimit,
    offset,
    order: [['codigo', 'ASC']]
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

const getById = async (id) => Cie10.findByPk(id);

const getByCode = async (codigo) => Cie10.findOne({ where: { codigo: normalizeCode(codigo) } });

const update = async (id, data) => {
  const cie10 = await Cie10.findByPk(id);
  if (!cie10) return null;

  const payload = {};

  if (Object.prototype.hasOwnProperty.call(data, 'codigo')) {
    const codigo = normalizeCode(data.codigo);
    if (!codigo) throw new Error('codigo es obligatorio');

    const existing = await Cie10.findOne({
      where: {
        codigo,
        id: { [Op.ne]: id }
      }
    });

    if (existing) {
      throw new Error('El código CIE10 ya existe');
    }

    payload.codigo = codigo;
  }

  if (Object.prototype.hasOwnProperty.call(data, 'descripcion')) {
    const descripcion = String(data.descripcion || '').trim();
    if (!descripcion) throw new Error('descripcion es obligatoria');
    payload.descripcion = descripcion;
  }

  await cie10.update(payload);
  return cie10;
};

module.exports = {
  create,
  getAll,
  update,
  getById,
  getByCode
};
