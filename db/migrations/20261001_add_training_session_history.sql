ALTER TABLE historia_cita
    ADD COLUMN IF NOT EXISTS tipo_historia VARCHAR(30) NOT NULL DEFAULT 'CLINICA',
    ADD COLUMN IF NOT EXISTS objetivo_sesion TEXT,
    ADD COLUMN IF NOT EXISTS grupos_ejercicios JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS agentes_biofisicos JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notas_ejercicios TEXT,
    ADD COLUMN IF NOT EXISTS notas_agentes_biofisicos TEXT,
    ADD COLUMN IF NOT EXISTS tiempo_total_ejercicio_minutos INTEGER,
    ADD COLUMN IF NOT EXISTS carga_total_levantada_kg DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS dolor_pre_sesion DECIMAL(3, 1),
    ADD COLUMN IF NOT EXISTS dolor_post_sesion DECIMAL(3, 1),
    ADD COLUMN IF NOT EXISTS respuesta_inmediata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS recomendaciones_sesion JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS observaciones_generales TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'historia_cita_tipo_historia_check'
    ) THEN
        ALTER TABLE historia_cita
            ADD CONSTRAINT historia_cita_tipo_historia_check
            CHECK (tipo_historia IN ('CLINICA', 'SESION_ENTRENAMIENTO'));
    END IF;
END $$;
