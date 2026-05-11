-- ============================================================
-- Script: Módulo Empleados + Motivos de Movimiento
-- Ejecutar UNA sola vez en SQL Server Management Studio
-- ============================================================

-- ── 1. TABLA MOTIVO_MOVIMIENTO ────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MOTIVO_MOVIMIENTO')
BEGIN
  CREATE TABLE MOTIVO_MOVIMIENTO (
    ID    INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE NVARCHAR(200) NOT NULL UNIQUE
  );
  PRINT 'Tabla MOTIVO_MOVIMIENTO creada.';
END
ELSE
  PRINT 'Tabla MOTIVO_MOVIMIENTO ya existe.';

-- Insertar los motivos iniciales (solo si no existen)
INSERT INTO MOTIVO_MOVIMIENTO (NOMBRE)
SELECT v.NOMBRE FROM (VALUES
  ('Inventario Inicial'),
  ('Dado de Baja'),
  ('Entrada Por Compra'),
  ('Daño Técnico'),
  ('Pérdida del Activo'),
  ('Préstamo'),
  ('Reposición'),
  ('Cambio de Ubicación'),
  ('Envío Taller Interno'),
  ('Envío Taller Externo'),
  ('Fuera de Servicio')
) AS v(NOMBRE)
WHERE NOT EXISTS (SELECT 1 FROM MOTIVO_MOVIMIENTO m WHERE m.NOMBRE = v.NOMBRE);

PRINT 'Motivos de movimiento insertados.';

-- ── 2. Agregar ID_MOTIVO a tabla MOVIMIENTO ────────────────────
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = 'MOVIMIENTO' AND COLUMN_NAME = 'ID_MOTIVO'
)
BEGIN
  ALTER TABLE MOVIMIENTO ADD ID_MOTIVO INT NULL
    CONSTRAINT FK_MOV_MOTIVO FOREIGN KEY REFERENCES MOTIVO_MOVIMIENTO(ID);
  PRINT 'Columna ID_MOTIVO agregada a MOVIMIENTO.';
END
ELSE
  PRINT 'Columna ID_MOTIVO ya existe en MOVIMIENTO.';

-- ── 3. TABLA EMPLEADO ─────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'EMPLEADO')
BEGIN
  CREATE TABLE EMPLEADO (
    ID        INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE    NVARCHAR(100)  NOT NULL,
    APELLIDO  NVARCHAR(100)  NOT NULL,
    CEDULA    VARCHAR(30)    NOT NULL UNIQUE,
    ID_DEPTO  VARCHAR(50)    NULL,
    CARGO     NVARCHAR(150)  NOT NULL DEFAULT '',
    ACTIVO    BIT            NOT NULL DEFAULT 1,
    FECHA_REG DATETIME2      NOT NULL DEFAULT GETUTCDATE()
  );
  PRINT 'Tabla EMPLEADO creada.';
END
ELSE
  PRINT 'Tabla EMPLEADO ya existe.';

-- Insertar empleados de ejemplo
IF NOT EXISTS (SELECT 1 FROM EMPLEADO)
BEGIN
  INSERT INTO EMPLEADO (NOMBRE, APELLIDO, CEDULA, CARGO, ACTIVO) VALUES
    ('Carlos',   'Mendoza',   'V-12345678', 'Técnico de Mantenimiento',  1),
    ('Ana',      'Rodríguez', 'V-23456789', 'Coordinadora de Activos',   1),
    ('Julián',   'Torres',    'V-34567890', 'Operador de Planta',         1),
    ('Luisa',    'García',    'V-45678901', 'Jefa de Administración',     1),
    ('Roberto',  'Díaz',      'V-56789012', 'Supervisor de Operaciones',  1),
    ('María',    'López',     'V-67890123', 'Analista de Sistemas',       1),
    ('Pedro',    'Castillo',  'V-78901234', 'Técnico Electricista',       1),
    ('Sofía',    'Herrera',   'V-89012345', 'Gestora de Compras',         1);
  PRINT 'Empleados de ejemplo insertados.';
END

-- Verificar
SELECT 'MOTIVO_MOVIMIENTO' as Tabla, COUNT(*) as Filas FROM MOTIVO_MOVIMIENTO
UNION ALL
SELECT 'EMPLEADO', COUNT(*) FROM EMPLEADO;
