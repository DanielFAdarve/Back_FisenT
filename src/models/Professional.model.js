const { Model, DataTypes } = require('sequelize');

class Professional extends Model {
    static initModel(sequelize) {
        return Professional.init(
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
                apellido: {
                    type: DataTypes.TEXT,
                     allowNull: true
                },
                especialidad: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                telefono: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                email: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                estado:{
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true  
                }
            }, {
            sequelize,
            modelName: 'Professional',
            tableName: 'profesional',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = Professional;
