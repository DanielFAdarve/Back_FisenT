const {Model,DataTypes} = require('sequelize');

class Professional extends Model {
    static initModel(sequelize){
        Professional.init(
            {
                id : {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                nombre : {
                    type: DataTypes.STRING(50), 
                    allowNull: false
                }
            },{
                sequelize,
                modelName: 'Professional',
                tableName: 'profesional',
                timestamps: false
            }
        );

    }

}

module.exports = Professional;
