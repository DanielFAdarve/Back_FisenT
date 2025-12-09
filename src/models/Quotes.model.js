const { Model, DataTypes } = require('sequelize');

class Quotes extends Model {
    static initModel(sequelize) {
        return Quotes.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                fecha_agendamiento: {
                    type: DataTypes.DATEONLY,
                    allowNull: false
                },
                horario_inicio: {
                    type: DataTypes.TIME,
                    allowNull: false
                },
                horario_fin: {
                    type: DataTypes.TIME,
                    allowNull: false
                },
                pagado: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false
                },
                numero_sesion: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                recordatorio: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false
                },
                id_estado_citas: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                motivo: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                id_profesional: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                id_paquetes: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                }
            }, {
            sequelize,
            modelName: 'Quotes',
            tableName: 'citas',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = Quotes;

