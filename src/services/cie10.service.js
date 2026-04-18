const { Op } = require('sequelize');
const { Cie10 } = require('../models');

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

const getAll = async ({ q, codigo } = {}) => {
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

  return Cie10.findAll({ where, order: [['codigo', 'ASC']] });
};

const getById = async (id) => Cie10.findByPk(id);

const getByCode = async (codigo) => Cie10.findOne({ where: { codigo: normalizeCode(codigo) } });

module.exports = {
  create,
  getAll,
  getById,
  getByCode
};
