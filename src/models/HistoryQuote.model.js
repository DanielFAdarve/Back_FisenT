const { Model, DataTypes } = require('sequelize');

class HistoryQuote extends Model {
    static initModel(sequelize) {
        return HistoryQuote.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                id_cita: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                fecha_evolucion: {
                    type: DataTypes.DATEONLY,
                    allowNull: true
                },
                subjetivo: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                objetivo: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                intervencion: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                descripcion_estado_paciente: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                recomendaciones: {
                    type: DataTypes.STRING(255),
                    allowNull: false
                },
                id_cie: {
                    type: DataTypes.INTEGER,
                    allowNull: false
                },
                tipo_historia: {
                    type: DataTypes.STRING(30),
                    allowNull: false,
                    defaultValue: 'CLINICA'
                },
                objetivo_sesion: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                grupos_ejercicios: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: []
                },
                agentes_biofisicos: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: {}
                },
                notas_ejercicios: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                notas_agentes_biofisicos: {
                    type: DataTypes.TEXT,
                    allowNull: true
                },
                tiempo_total_ejercicio_minutos: {
                    type: DataTypes.INTEGER,
                    allowNull: true
                },
                carga_total_levantada_kg: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: true
                },
                dolor_pre_sesion: {
                    type: DataTypes.DECIMAL(3, 1),
                    allowNull: true
                },
                dolor_post_sesion: {
                    type: DataTypes.DECIMAL(3, 1),
                    allowNull: true
                },
                respuesta_inmediata: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: {}
                },
                recomendaciones_sesion: {
                    type: DataTypes.JSONB,
                    allowNull: false,
                    defaultValue: []
                },
                observaciones_generales: {
                    type: DataTypes.TEXT,
                    allowNull: true
                }
            }, {
            sequelize,
            modelName: 'HistoryQuote',
            tableName: 'historia_cita',
            timestamps: false,
            underscored: true
        }
        );

    }

}

module.exports = HistoryQuote;
