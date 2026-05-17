const { Op, where: sequelizeWhere, fn, col } = require('sequelize');
const { Patient, Cie10 } = require('../models');
const Pagination = require('../models/Pagination.models');

const ensureDiagnosisExists = async (id_cie, label = 'principal') => {
  if (!id_cie) return;

  const diagnosis = await Cie10.findByPk(id_cie);

  if (!diagnosis) {
    throw new Error(`El código CIE10 ${label} del paciente no existe`);
  }
};

const patientInclude = [
  {
    model: Cie10,
    as: 'diagnosis'
  }
];

const createPatient = async (data) => {
  if (!data.tipo_doc || data.tipo_doc.length < 1) {
    throw new Error('El tipo de documento es obligatorio');
  }

  await ensureDiagnosisExists(data.id_cie, 'principal');

  if (!data.antecedentes) {
    data.antecedentes =
      data.antecedentes_personales ||
      'Sin antecedentes reportados';
  }

  return await Patient.create(data);
};

const getAllPatients = async ({
  search = '',
  page = 1,
  limit = 20
}) => {

  const { page: normalizedPage, limit: normalizedLimit } = Pagination.normalize({
    page,
    limit
  });
  const offset = (normalizedPage - 1) * normalizedLimit;

  const where = {
    estado: true
  };

  if (search && search.trim() !== '') {
    const searchLower = `%${search.toLowerCase()}%`;

    where[Op.or] = [
      sequelizeWhere(
        fn('LOWER', col('nombre')),
        {
          [Op.like]: searchLower
        }
      ),
      sequelizeWhere(
        fn('LOWER', col('apellido')),
        {
          [Op.like]: searchLower
        }
      ),
      sequelizeWhere(
        fn('LOWER', col('num_doc')),
        {
          [Op.like]: searchLower
        }
      )
    ];
  }

  const { rows, count } = await Patient.findAndCountAll({
    where,
    include: patientInclude,
    limit: normalizedLimit,
    offset,
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
};

const getPatientById = async (id) => {
  return await Patient.findOne({
    where: { id },
    include: patientInclude
  });
};

const getPatientByDocumentNumber = async (num_doc) => {
  return await Patient.findOne({
    where: { num_doc },
    include: patientInclude
  });
};

const updatePatient = async (id, data) => {

  await ensureDiagnosisExists(data.id_cie, 'principal');

  if (data.antecedentes_personales && !data.antecedentes) {
    data.antecedentes = data.antecedentes_personales;
  }

  const [updated] = await Patient.update(data, {
    where: { id }
  });

  return updated
    ? await Patient.findOne({
      where: { id },
      include: patientInclude
    })
    : null;
};

const deletePatient = async (id) => {

  const [updated] = await Patient.update(
    { estado: false },
    { where: { id } }
  );

  return updated
    ? await Patient.findOne({
      where: { id },
      include: patientInclude
    })
    : null;
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  getPatientByDocumentNumber,
  updatePatient,
  deletePatient
};