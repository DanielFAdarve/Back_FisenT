const { Model, DataTypes } = require('sequelize');

class HistoryQuote extends Model {
    static initModel(sequelize) {
        return HistoryQuote.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                id_cita: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                descripcion_estado_paciente: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                recomendaciones: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                id_cie: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                }
            }, {
            sequelize,
            modelName: 'HistoryQuote',
            tableName: 'historia_cita',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = HistoryQuote;
