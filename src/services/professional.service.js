const { Op } = require('sequelize');
const { Professional } = require('../models');
const Pagination = require('../models/Pagination.models');

const getAllProfessional = async ({ page = 1, limit = 20, search = '' } = {}) => {
  const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({ page, limit });
  const offset = (normalizedPage - 1) * normalizedLimit;
  const where = {};

  if (search && search.trim() !== '') {
    const value = `%${search.trim()}%`;
    where[Op.or] = [
      { nombre: { [Op.iLike]: value } },
      { apellido: { [Op.iLike]: value } },
      { especialidad: { [Op.iLike]: value } },
      { email: { [Op.iLike]: value } }
    ];
  }

  const { rows, count } = await Professional.findAndCountAll({
    where,
    limit: normalizedLimit,
    offset,
    order: [['nombre', 'ASC']],
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

module.exports = {
  getAllProfessional
};
