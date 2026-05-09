-- ============================================================
-- Script: Tabla de Frecuencias de Plan de Mantenimiento
-- Ejecutar UNA sola vez en SQL Server Management Studio
-- ============================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FRECUENCIA_PLAN')
BEGIN
  CREATE TABLE FRECUENCIA_PLAN (
    ID          INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE      NVARCHAR(100) NOT NULL UNIQUE,  -- Ej: "Mensual"
    DESCRIPCION NVARCHAR(200) NULL,             -- Ej: "12 veces/año"
    VECES_ANO   INT           NULL,             -- Cuántas veces al año ocurre
    ACTIVO      BIT           NOT NULL DEFAULT 1,
    ORDEN       INT           NOT NULL DEFAULT 99  -- Para ordenar en dropdowns
  );
  PRINT 'Tabla FRECUENCIA_PLAN creada.';
END
ELSE
  PRINT 'Tabla FRECUENCIA_PLAN ya existe.';

-- Insertar frecuencias iniciales (solo si no existen)
INSERT INTO FRECUENCIA_PLAN (NOMBRE, DESCRIPCION, VECES_ANO, ORDEN)
SELECT v.NOMBRE, v.DESCRIPCION, v.VECES_ANO, v.ORDEN
FROM (VALUES
  ('Diaria',       'Todos los días (365 veces/año)',    365, 1),
  ('Semanal',      'Una vez por semana (52 veces/año)',  52, 2),
  ('Quincenal',    'Cada 15 días (24 veces/año)',        24, 3),
  ('Mensual',      'Una vez al mes (12 veces/año)',      12, 4),
  ('Bimestral',    'Cada 2 meses (6 veces/año)',          6, 5),
  ('Trimestral',   'Cada 3 meses (4 veces/año)',          4, 6),
  ('Cuatrimestral','Cada 4 meses (3 veces/año)',          3, 7),
  ('Semestral',    'Cada 6 meses (2 veces/año)',          2, 8),
  ('Anual',        'Una vez al año (1 vez/año)',          1, 9)
) AS v(NOMBRE, DESCRIPCION, VECES_ANO, ORDEN)
WHERE NOT EXISTS (
  SELECT 1 FROM FRECUENCIA_PLAN f WHERE f.NOMBRE = v.NOMBRE
);

PRINT 'Frecuencias iniciales insertadas.';

-- Verificar resultado
SELECT ID, NOMBRE, DESCRIPCION, VECES_ANO, ORDEN, ACTIVO
FROM FRECUENCIA_PLAN
ORDER BY ORDEN;
