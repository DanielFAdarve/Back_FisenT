const {Model,DataTypes} = require('sequelize');

    class Packages extends Model {
        static initModel(sequelize){
        Patient.init(
            {
                id : {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                id_pacientes : {
                    type: DataTypes.STRING, 
                    allowNull: false
                },
                id_paquetes_atenciones : {
                    type: DataTypes.STRING, 
                    allowNull: false
                },
                id_estado_citas : {
                    type: DataTypes.STRING, 
                    allowNull: false
                }
                },{
                sequelize,
                modelName: 'Packages',
                tableName: 'paquetes',
                timestamps: false
            }
        );

    }

}

module.exports = Packages;



















