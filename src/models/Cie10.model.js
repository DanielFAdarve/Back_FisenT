const { Model, DataTypes } = require('sequelize');

class Cie10 extends Model {
    static initModel(sequelize) {
        return Cie10.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                codigo: {
                    type: DataTypes.STRING(10),
                    allowNull: false
                },
                descripcion: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                }
            }, {
            sequelize,
            modelName: 'Cie10',
            tableName: 'cie10',
            timestamps: false
        }
        );

    }

}

module.exports = Cie10;
