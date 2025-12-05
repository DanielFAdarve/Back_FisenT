const { Model, DataTypes } = require('sequelize');

class Packages extends Model {
    static initModel(sequelize) {
        return Packages.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                id_pacientes: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'pacientes',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'NO ACTION'
                },
                id_paquetes_atenciones: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'atencion_paquetes',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'NO ACTION'
                },
                id_estado_citas: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'estado_paquetes',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'NO ACTION'
                }
            },
            {
                sequelize,
                modelName: 'Packages',
                tableName: 'paquetes',
                timestamps: false
            }
        );
    }
}

module.exports = Packages;
