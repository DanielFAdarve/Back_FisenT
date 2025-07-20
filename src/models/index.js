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

// Inicialización de modelos (retornando la instancia)
const AttentionPackagesModel = AttentionPackages.initModel(sequelize);
const Cie10Model = Cie10.initModel(sequelize);
const HistoryQuoteModel = HistoryQuote.initModel(sequelize);
const PackagesModel = Packages.initModel(sequelize);
const PatientModel = Patient.initModel(sequelize);
const ProfessionalModel = Professional.initModel(sequelize);
const QuotesModel = Quotes.initModel(sequelize);
const StatusPackagesModel = StatusPackages.initModel(sequelize);
const StatusQuotesModel = StatusQuotes.initModel(sequelize);
const UserModel = User.initModel(sequelize);

// Relaciones
QuotesModel.belongsTo(ProfessionalModel, { foreignKey: 'id_profesional' });
QuotesModel.belongsTo(PackagesModel, { foreignKey: 'id_paquetes' });
QuotesModel.belongsTo(StatusQuotesModel, { foreignKey: 'id_estado_citas' });

PackagesModel.belongsTo(PatientModel, { foreignKey: 'id_pacientes' });
PackagesModel.belongsTo(AttentionPackagesModel, { foreignKey: 'id_paquetes_atenciones' });
PackagesModel.belongsTo(StatusPackagesModel, { foreignKey: 'id_estado_citas' });

HistoryQuoteModel.belongsTo(QuotesModel, { foreignKey: 'id_cita' });
HistoryQuoteModel.belongsTo(Cie10Model, { foreignKey: 'id_cie' });

module.exports = {
  sequelize,
  AttentionPackages: AttentionPackagesModel,
  Cie10: Cie10Model,
  HistoryQuote: HistoryQuoteModel,
  Packages: PackagesModel,
  Patient: PatientModel,
  Professional: ProfessionalModel,
  Quotes: QuotesModel,
  StatusPackages: StatusPackagesModel,
  StatusQuotes: StatusQuotesModel,
  User: UserModel
};