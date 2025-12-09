const { Model, DataTypes } = require("sequelize");

class Payment extends Model {
    static initModel(sequelize) {
        return Payment.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                id_paquete: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                id_cita: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                valor: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                metodo_pago: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
                fecha_pago: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                },
                observacion: DataTypes.TEXT,
                tipo: {                  // paquete | cita
                    type: DataTypes.STRING(20),
                    allowNull: false
                }
            },
            {
                sequelize,
                modelName: "Payment",
                tableName: "pagos",
                timestamps: false
            }
        );
    }
}

module.exports = Payment;