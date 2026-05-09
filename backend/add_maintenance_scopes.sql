-- ============================================================
-- SCAF: Módulos de Mantenimiento (SCOPE_MANT)
-- Ejecutar en SQL Server Management Studio
-- Idempotente: se puede ejecutar múltiples veces sin errores
-- ============================================================

-- 1. Crear tabla SCOPE_MANT si no existe
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SCOPE_MANT')
BEGIN
  CREATE TABLE SCOPE_MANT (
    ID      INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE  NVARCHAR(100) NOT NULL,
    SLUG    NVARCHAR(50)  NOT NULL UNIQUE,   -- clave URL: 'area', 'habitacion', 'activo'
    COLOR   NVARCHAR(50)  NOT NULL DEFAULT '#3b82f6',  -- hex color
    ICONO   NVARCHAR(50)  NOT NULL DEFAULT 'Wrench',   -- nombre de icono Lucide
    ACTIVO  BIT           NOT NULL DEFAULT 1,
    ORDEN   INT           NOT NULL DEFAULT 99
  );
  PRINT 'Tabla SCOPE_MANT creada.';
END
ELSE
BEGIN
  PRINT 'Tabla SCOPE_MANT ya existe.';
END

-- 2. Insertar los 3 módulos por defecto (solo si no existen)
INSERT INTO SCOPE_MANT (NOMBRE, SLUG, COLOR, ICONO, ORDEN)
SELECT v.NOMBRE, v.SLUG, v.COLOR, v.ICONO, v.ORDEN
FROM (VALUES
  (N'Mantenimientos de Área',       'area',       '#3b82f6', 'MapPin',    1),
  (N'Mantenimiento de Habitaciones','habitacion',  '#22c55e', 'DoorOpen',  2),
  (N'Mantenimiento de Activos',     'activo',      '#eab308', 'Box',       3)
) AS v(NOMBRE, SLUG, COLOR, ICONO, ORDEN)
WHERE NOT EXISTS (SELECT 1 FROM SCOPE_MANT s WHERE s.SLUG = v.SLUG);

PRINT 'Módulos por defecto insertados.';

-- 3. Agregar columna ID_SCOPE a TICKET_MANT si no existe
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'TICKET_MANT' AND COLUMN_NAME = 'ID_SCOPE'
)
BEGIN
  ALTER TABLE TICKET_MANT ADD ID_SCOPE INT NULL;
  PRINT 'Columna ID_SCOPE agregada a TICKET_MANT.';
END
ELSE
BEGIN
  PRINT 'Columna ID_SCOPE ya existe en TICKET_MANT.';
END

-- 4. Asignar scope 'activo' a todos los tickets existentes que no tienen scope
EXEC sp_executesql N'
  UPDATE TICKET_MANT
  SET ID_SCOPE = (SELECT TOP 1 ID FROM SCOPE_MANT WHERE SLUG = ''activo'')
  WHERE ID_SCOPE IS NULL
';

PRINT 'Tickets existentes asignados al scope "activo".';

-- 5. Agregar columna ID_SCOPE a PLAN_MANT si no existe
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'PLAN_MANT' AND COLUMN_NAME = 'ID_SCOPE'
)
BEGIN
  ALTER TABLE PLAN_MANT ADD ID_SCOPE INT NULL;
  PRINT 'Columna ID_SCOPE agregada a PLAN_MANT.';
END
ELSE
BEGIN
  PRINT 'Columna ID_SCOPE ya existe en PLAN_MANT.';
END

-- 6. Asignar scope 'activo' a todos los planes existentes que no tienen scope
EXEC sp_executesql N'
  UPDATE PLAN_MANT
  SET ID_SCOPE = (SELECT TOP 1 ID FROM SCOPE_MANT WHERE SLUG = ''activo'')
  WHERE ID_SCOPE IS NULL
';

PRINT 'Planes existentes asignados al scope "activo".';

-- 7. Agregar columna ID_SCOPE a ORDEN_TRAB si no existe
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'ORDEN_TRAB' AND COLUMN_NAME = 'ID_SCOPE'
)
BEGIN
  ALTER TABLE ORDEN_TRAB ADD ID_SCOPE INT NULL;
  PRINT 'Columna ID_SCOPE agregada a ORDEN_TRAB.';
END
ELSE
BEGIN
  PRINT 'Columna ID_SCOPE ya existe en ORDEN_TRAB.';
END

-- 8. Asignar scope 'activo' a todas las órdenes de trabajo existentes que no tienen scope
EXEC sp_executesql N'
  UPDATE ORDEN_TRAB
  SET ID_SCOPE = (SELECT TOP 1 ID FROM SCOPE_MANT WHERE SLUG = ''activo'')
  WHERE ID_SCOPE IS NULL
';

PRINT 'Órdenes de trabajo existentes asignadas al scope "activo".';

PRINT '✅ Migración de SCOPE_MANT completada.';
