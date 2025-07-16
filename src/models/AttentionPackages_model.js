const { Model,DataTypes } = require("sequelize");

class AttentionPackages extends Model {
    static initModel(sequelize){
        AttentionPackages.init(
            {
                id : {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                descripcion : {
                    type: DataTypes.STRING(100), 
                    allowNull: false
                }, 
                cantidad_sesiones : {
                    type: DataTypes.INTEGER, 
                    allowNull: false
                },
                valor : {
                    type: DataTypes.INTEGER
                }
            },{
                sequelize,
                modelName: 'AttentionPackages',
                tableName: 'atencion_paquetes',
                timestamps: false
            }
        );

    }

}

module.exports = AttentionPackages;
