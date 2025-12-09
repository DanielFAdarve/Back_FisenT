const Sequelize = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

// const sequelize = new Sequelize({
//   dialect: 'sqlite',
//   storage: path.join(__dirname, '../db/database.sqlite'),
//   logging: false
// });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Importación de modelos
/* importing the model definition
for the  entity from the '.js`. This allows the
code to access and interact with the  model within the Sequelize ORM framework. */

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
const Payment = require('./Payment.model');

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
const PaymentModel = Payment.initModel(sequelize);
// Relaciones

// PACIENTE → PAQUETES
PatientModel.hasMany(PackagesModel, { foreignKey: 'id_pacientes' });
PackagesModel.belongsTo(PatientModel, { foreignKey: 'id_pacientes', as: 'patient' });

// CONFIGURACIÓN DE PAQUETES → PAQUETES
AttentionPackagesModel.hasMany(PackagesModel, { foreignKey: 'id_paquetes_atenciones', as : 'packages'  });
PackagesModel.belongsTo(AttentionPackagesModel, { foreignKey: 'id_paquetes_atenciones', as: 'attentionPackage' });

// ESTADO → PAQUETES
StatusPackagesModel.hasMany(PackagesModel, { foreignKey: 'id_estado_citas' });
PackagesModel.belongsTo(StatusPackagesModel, { foreignKey: 'id_estado_citas', as: 'statusPackage' });

// PAQUETES → CITAS
PackagesModel.hasMany(QuotesModel, { foreignKey: 'id_paquetes' });
QuotesModel.belongsTo(PackagesModel, { foreignKey: 'id_paquetes' });

// PROFESIONAL → CITAS
ProfessionalModel.hasMany(QuotesModel, { foreignKey: 'id_profesional' });
QuotesModel.belongsTo(ProfessionalModel, { foreignKey: 'id_profesional' });

// ESTADO DE CITAS → CITAS
StatusQuotesModel.hasMany(QuotesModel, { foreignKey: 'id_estado_citas' });
QuotesModel.belongsTo(StatusQuotesModel, { foreignKey: 'id_estado_citas' });

// CITA → HISTORIAL
QuotesModel.hasMany(HistoryQuoteModel, { foreignKey: 'id_cita' });
HistoryQuoteModel.belongsTo(QuotesModel, { foreignKey: 'id_cita', as: 'Quotes' });

// CIE10 → HISTORIA
Cie10Model.hasMany(HistoryQuoteModel, { foreignKey: 'id_cie' });
HistoryQuoteModel.belongsTo(Cie10Model, { foreignKey: 'id_cie', as: 'Cie10' });

//Pagos 
PaymentModel.belongsTo(PackagesModel, { foreignKey: "id_paquete" });
PaymentModel.belongsTo(QuotesModel, { foreignKey: "id_cita" });

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
  User: UserModel,
  Payment: PaymentModel
};