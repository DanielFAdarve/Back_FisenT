const { Model, DataTypes } = require('sequelize');

class StatusQuotes extends Model {
    static initModel(sequelize) {
        return StatusQuotes.init(
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
            modelName: 'StatusQuotes',
            tableName: 'estado_citas',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = StatusQuotes;
