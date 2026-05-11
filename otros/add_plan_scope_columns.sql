-- ============================================================
-- Script: Agregar columnas de Alcance (Scope) a la tabla PLAN_MANT
-- Ejecutar UNA sola vez en SQL Server Management Studio
-- ============================================================

-- Agregar ID_CATEGORIA (ID de la Categoría raíz del árbol de CATEGORIA)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLAN_MANT' AND COLUMN_NAME = 'ID_CATEGORIA'
)
BEGIN
  ALTER TABLE PLAN_MANT ADD ID_CATEGORIA NVARCHAR(50) NULL;
  PRINT 'Columna ID_CATEGORIA agregada a PLAN_MANT';
END
ELSE
  PRINT 'Columna ID_CATEGORIA ya existe, no se modifica.';

-- Agregar ID_FAMILIA (ID de la Familia / Hijo de Categoría)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLAN_MANT' AND COLUMN_NAME = 'ID_FAMILIA'
)
BEGIN
  ALTER TABLE PLAN_MANT ADD ID_FAMILIA NVARCHAR(50) NULL;
  PRINT 'Columna ID_FAMILIA agregada a PLAN_MANT';
END
ELSE
  PRINT 'Columna ID_FAMILIA ya existe, no se modifica.';

-- Agregar FAM_NOMBRE (Nombre legible de la Familia para mostrar en UI)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLAN_MANT' AND COLUMN_NAME = 'FAM_NOMBRE'
)
BEGIN
  ALTER TABLE PLAN_MANT ADD FAM_NOMBRE NVARCHAR(200) NULL;
  PRINT 'Columna FAM_NOMBRE agregada a PLAN_MANT';
END
ELSE
  PRINT 'Columna FAM_NOMBRE ya existe, no se modifica.';

-- Verificar resultado
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PLAN_MANT'
ORDER BY ORDINAL_POSITION;
