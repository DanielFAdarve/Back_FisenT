/* The Patient class defines the model for a patient entity with various attributes in a Sequelize
environment. */
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
                id_cie: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
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
                },
                antecedentes_personales: DataTypes.TEXT,
                antecedentes_patologicos: DataTypes.TEXT,
                antecedentes_quirurgicos: DataTypes.TEXT,
                antecedentes_traumaticos: DataTypes.TEXT,
                antecedentes_farmacologicos: DataTypes.TEXT,
                antecedentes_familiares: DataTypes.TEXT,
                antecedentes_sociales: DataTypes.TEXT,
                estado: {type:DataTypes.BOOLEAN, defaultValue: true},
            }, {
            sequelize,
            modelName: 'Patient',
            tableName: 'pacientes',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = Patient;
