# Historia de sesión de entrenamiento

Las historias de entrenamiento se almacenan en `historia_cita` con `tipo_historia = "SESION_ENTRENAMIENTO"`. El servicio acepta únicamente citas cuyo tipo de paquete sea `SESION ENTRENAMIENTO` (la comparación no depende de mayúsculas, tildes o espacios extra). Las historias existentes mantienen `tipo_historia = "CLINICA"` y las rutas actuales no cambian.

Al iniciar el servidor, la migración `db/migrations/20261001_add_training_session_history.sql` agrega las columnas y registra su ejecución en `schema_migrations`.

## Rutas nuevas

- `POST /history/sesion-entrenamiento/create`
- `PUT /history/sesion-entrenamiento/update/:id`
- `GET /history/sesion-entrenamiento/:id`
- `GET /history/sesion-entrenamiento/export-docx/:id`

`id_cita` es obligatorio. `id_cie` es opcional si el paciente o el paquete ya tienen diagnóstico asociado; de lo contrario debe enviarse. Una cita solo puede tener una historia, igual que en la evolución clínica existente.

## Ejemplo de creación

```json
{
  "id_cita": 145,
  "id_cie": 10,
  "objetivo_sesion": "Mejorar fuerza y control motor de miembro inferior.",
  "grupos_ejercicios": [
    {
      "grupo": "Fortalecimiento de miembro inferior",
      "ejercicios": [
        {
          "ejercicio": "Sentadilla asistida",
          "series": 3,
          "repeticiones": 12,
          "carga_kg": 10,
          "observaciones": "Técnica controlada"
        },
        {
          "ejercicio": "Puente de glúteos",
          "series": 3,
          "repeticiones": 15,
          "carga_kg": 0
        }
      ]
    },
    {
      "grupo": "Control motor",
      "ejercicios": [
        {
          "ejercicio": "Equilibrio unipodal",
          "series": 3,
          "repeticiones": 10,
          "observaciones": "Con apoyo inicial"
        }
      ]
    }
  ],
  "agentes_biofisicos": {
    "tens": {
      "convencional": true,
      "intensidad_ma": 18
    },
    "ultrasonido": {
      "pulsado": true,
      "porcentaje": 20,
      "w_cm2": 0.8,
      "tiempo_min": 5
    },
    "termoterapia": {
      "crioterapia": true,
      "tiempo_min": 10
    },
    "otros": {
      "laser": false,
      "magneto": false,
      "ondas_choque": false
    }
  },
  "tiempo_total_ejercicio_minutos": 40,
  "carga_total_levantada_kg": 270,
  "dolor_pre_sesion": 4,
  "dolor_post_sesion": 2,
  "respuesta_inmediata": {
    "fatiga_controlada": true,
    "dolor_durante_ejecucion": false,
    "mejora_tecnica": true
  },
  "notas_ejercicios": "Se toleró la progresión de carga.",
  "notas_agentes_biofisicos": "Sin eventos adversos.",
  "recomendaciones_sesion": [
    "Mantener hidratación adecuada.",
    "Realizar movilidad suave en casa."
  ],
  "observaciones_generales": "Paciente finaliza estable."
}
```

`grupos_ejercicios` es JSONB y admite cualquier cantidad de grupos y ejercicios. El DOCX se genera desde `src/templates/Detalle de Sesión_ Ejercicios y Agentes - FISEN THERAPY.docx`; cada grupo se imprime con sus ejercicios, series, repeticiones, carga y observaciones.
