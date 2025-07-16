const {Model,DataTypes} = require('sequelize');

    class Quotes extends Model {
        static initModel(sequelize){
        Quotes.init(
            {
                id : {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                fecha_agendamiento : {
                    type: DataTypes.DATEONLY, 
                    allowNull: false
                },
                numero_sesion : {
                    type: DataTypes.INTEGER, 
                    allowNull: false
                },
                recordatorio : {
                    type: DataTypes.BOOLEAN, 
                    allowNull: false
                },
                id_estado_citas : {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                motivo : {
                    type: DataTypes.STRING(255),
                    allowNull: fasle
                },
                id_profesional : {
                    type: DataTypes.INTEGER,
                    allowNull: false
                }, 
                id_paquetes : {
                    type: DataTypes.INTEGER,
                    allowNull: false
                }
                },{
                sequelize,
                modelName: 'Quotes',
                tableName: 'citas',
                timestamps: false
            }
        );

    }

}

module.exports = Quotes;

