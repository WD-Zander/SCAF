-- ============================================================
-- Script: Agregar columnas de Alcance (Scope) a la tabla PLANES
-- Ejecutar UNA sola vez en SQL Server Management Studio
-- ============================================================

-- Agregar CAT_ID (ID de la Categoría raíz del árbol de CATEGORIAS)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLANES' AND COLUMN_NAME = 'CAT_ID'
)
BEGIN
  ALTER TABLE PLANES ADD CAT_ID NVARCHAR(50) NULL;
  PRINT 'Columna CAT_ID agregada a PLANES';
END
ELSE
  PRINT 'Columna CAT_ID ya existe, no se modifica.';

-- Agregar FAM_ID (ID de la Familia / Hijo de Categoría)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLANES' AND COLUMN_NAME = 'FAM_ID'
)
BEGIN
  ALTER TABLE PLANES ADD FAM_ID NVARCHAR(50) NULL;
  PRINT 'Columna FAM_ID agregada a PLANES';
END
ELSE
  PRINT 'Columna FAM_ID ya existe, no se modifica.';

-- Agregar FAM_NOMBRE (Nombre legible de la Familia para mostrar en UI)
IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'PLANES' AND COLUMN_NAME = 'FAM_NOMBRE'
)
BEGIN
  ALTER TABLE PLANES ADD FAM_NOMBRE NVARCHAR(200) NULL;
  PRINT 'Columna FAM_NOMBRE agregada a PLANES';
END
ELSE
  PRINT 'Columna FAM_NOMBRE ya existe, no se modifica.';

-- Verificar resultado
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'PLANES'
ORDER BY ORDINAL_POSITION;
