-- Ejecutar en Supabase SQL Editor ANTES de la migración
-- Corrige tipos de columna y constraints

-- 1. Hacer id_activo nullable en tablas que soportan mantenimiento de infraestructura
ALTER TABLE orden_trab ALTER COLUMN id_activo DROP NOT NULL;
ALTER TABLE ticket_mant ALTER COLUMN id_activo DROP NOT NULL;

-- 2. Asegurar que columnas BOOLEAN sean realmente boolean (no integer/smallint)
-- CONFIG_EMP
ALTER TABLE config_emp ALTER COLUMN permitir_borrado TYPE boolean USING (permitir_borrado::boolean);

-- ESTADO_ACTIVO — verificar si ACTIVO existe como int
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estado_activo' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE estado_activo ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- FORMA_PAGO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='forma_pago' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE forma_pago ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- MOTIVO_MOVIMIENTO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='motivo_movimiento' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE motivo_movimiento ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- FRECUENCIA_PLAN
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='frecuencia_plan' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE frecuencia_plan ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- SCOPE_MANT
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scope_mant' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE scope_mant ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- PROVEEDOR
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='proveedor' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE proveedor ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- EMPLEADO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='empleado' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE empleado ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- ACTIVO (borrado)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='activo' AND column_name='borrado' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE activo ALTER COLUMN borrado TYPE boolean USING (borrado::int::boolean);
  END IF;
END $$;

-- PLAN_MANT
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_mant' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE plan_mant ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- TAREA_PLAN
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarea_plan' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE tarea_plan ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- TICKET_MANT
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_mant' AND column_name='borrado' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE ticket_mant ALTER COLUMN borrado TYPE boolean USING (borrado::int::boolean);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_mant' AND column_name='completado' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE ticket_mant ALTER COLUMN completado TYPE boolean USING (completado::int::boolean);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ticket_mant' AND column_name='es_preventivo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE ticket_mant ALTER COLUMN es_preventivo TYPE boolean USING (es_preventivo::int::boolean);
  END IF;
END $$;

-- TAREA_TICKET
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tarea_ticket' AND column_name='completado' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE tarea_ticket ALTER COLUMN completado TYPE boolean USING (completado::int::boolean);
  END IF;
END $$;

-- MOVIMIENTO
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='movimiento' AND column_name='activo' AND data_type NOT IN ('boolean')) THEN
    ALTER TABLE movimiento ALTER COLUMN activo TYPE boolean USING (activo::int::boolean);
  END IF;
END $$;

-- CATEGORIA: quitar FK self-referencing temporalmente (la migración tiene orden topológico que puede fallar)
-- El script de migración deshabilitará triggers de todas formas
