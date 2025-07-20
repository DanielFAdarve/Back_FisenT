const { Model, DataTypes } = require('sequelize');

class Patient extends Model {
    static initModel(sequelize) {
        return Patient.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                tipo_doc: {
                    type: DataTypes.STRING(3),
                    allowNull: false
                },
                num_doc: {
                    type: DataTypes.STRING(20),
                    allowNull: false
                },
                nombre: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
                apellido: {
                    type: DataTypes.STRING(50),
                    allowNull: false
                },
                direccion: DataTypes.STRING,
                telefono: DataTypes.STRING,
                telefono_secundario: DataTypes.STRING,
                email: DataTypes.STRING,
                fecha_nacimiento: {
                    type: DataTypes.DATEONLY,
                    allowNull: false
                },
                genero: {
                    type: DataTypes.STRING(1),
                    defaultValue: 'O'
                },
                procedencia: DataTypes.STRING,
                zona: {
                    type: DataTypes.STRING(1),
                    defaultValue: 'U'
                },
                ocupacion: DataTypes.STRING,
                eps: DataTypes.STRING,
                regimen: DataTypes.STRING,
                modalidad_deportiva: DataTypes.STRING,
                red_apoyo: DataTypes.BOOLEAN,
                antecedentes: {
                    type: DataTypes.STRING,
                    allowNull: false
                }
            }, {
            sequelize,
            modelName: 'Patient',
            tableName: 'pacientes',
            timestamps: false
        }
        );

    }

}

module.exports = Patient;
