const { Patient, Professional } = require('../models');

const getAllProfessional = async () => {
  return await Professional.findAll();
}

module.exports = {
  getAllProfessional
}