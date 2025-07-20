const { Model, DataTypes } = require('sequelize');

class StatusPackages extends Model {
    static initModel(sequelize) {
        return StatusPackages.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                nombre: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
                descripcion: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                }
            }, {
            sequelize,
            modelName: 'StatusPackages',
            tableName: 'estado_paquetes',
            timestamps: false
        }
        );

    }

}

module.exports = StatusPackages;
