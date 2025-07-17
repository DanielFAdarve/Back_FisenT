const Sequelize = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../db/database.sqlite'),
  logging: false
});

// Importación de modelos
const AttentionPackages = require('./AttentionPackages.model');
const Cie10 = require('./Cie10.model');
const HistoryQuote = require('./HistoryQuote.model');
const Packages = require('./Packages.model');
const Patient = require('./Patient.model');
const Professional = require('./Professional.model');
const Quotes = require('./Quotes.model');
const StatusPackages = require('./StatusPackages.model');
const StatusQuotes = require('./StatusQuotes.model');
const User = require('./User.model');

// Inicialización
AttentionPackages.initModel(sequelize);
Cie10.initModel(sequelize);
HistoryQuote.initModel(sequelize);
Packages.initModel(sequelize);
Patient.initModel(sequelize);
Professional.initModel(sequelize);
Quotes.initModel(sequelize);
StatusPackages.initModel(sequelize);
StatusQuotes.initModel(sequelize);
User.initModel(sequelize);

// Relaciones
Quotes.belongsTo(Professional, { foreignKey: 'id_profesional' });
Quotes.belongsTo(Packages, { foreignKey: 'id_paquetes' });
Quotes.belongsTo(StatusQuotes, { foreignKey: 'id_estado_citas' });

Packages.belongsTo(Patient, { foreignKey: 'id_pacientes' });
Packages.belongsTo(AttentionPackages, { foreignKey: 'id_paquetes_atenciones' });
Packages.belongsTo(StatusPackages, { foreignKey: 'id_estado_citas' });

HistoryQuote.belongsTo(Quotes, { foreignKey: 'id_cita' });
HistoryQuote.belongsTo(Cie10, { foreignKey: 'id_cie' });

module.exports = {
  sequelize,
  AttentionPackages,
  Cie10,
  HistoryQuote,
  Packages,
  Patient,
  Professional,
  Quotes,
  StatusPackages,
  StatusQuotes,
  User
};