-- =====================================================
-- MIGRACION: Tipos de Entidad para Modulos de Mantenimiento
-- Fecha: 2026-05-13
-- Descripcion: Agrega soporte para entidades polimorficas
--   (Activo, Area, Habitacion) en ordenes de trabajo y tickets
-- =====================================================

-- 1. Agregar TIPO_ENTIDAD a SCOPE_MANT
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SCOPE_MANT' AND COLUMN_NAME = 'TIPO_ENTIDAD')
BEGIN
    ALTER TABLE SCOPE_MANT ADD TIPO_ENTIDAD VARCHAR(20) NOT NULL DEFAULT 'activo';
    PRINT 'SCOPE_MANT.TIPO_ENTIDAD agregado';
END
GO
UPDATE SCOPE_MANT SET TIPO_ENTIDAD = 'area' WHERE SLUG = 'area';
UPDATE SCOPE_MANT SET TIPO_ENTIDAD = 'habitacion' WHERE SLUG = 'habitacion';
UPDATE SCOPE_MANT SET TIPO_ENTIDAD = 'activo' WHERE SLUG = 'activo';
PRINT 'SCOPE_MANT.TIPO_ENTIDAD poblado';
GO

-- 2. Crear tabla AREA
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AREA')
BEGIN
    CREATE TABLE AREA (
        ID          VARCHAR(50)    NOT NULL PRIMARY KEY,
        NOMBRE      VARCHAR(150)   NOT NULL,
        UBICACION   VARCHAR(200)   NULL,
        PISO        VARCHAR(50)    NULL,
        DESCRIPCION NVARCHAR(MAX)  NULL,
        ACTIVO      BIT            NOT NULL DEFAULT 1,
        FECHA_CREA  DATETIME       NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'Tabla AREA creada';
END
GO

-- 3. Crear tabla HABITACION
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'HABITACION')
BEGIN
    CREATE TABLE HABITACION (
        ID          VARCHAR(50)    NOT NULL PRIMARY KEY,
        NOMBRE      VARCHAR(150)   NOT NULL,
        NUMERO      VARCHAR(20)    NULL,
        ID_AREA     VARCHAR(50)    NULL,
        PISO        VARCHAR(50)    NULL,
        TIPO        VARCHAR(50)    NULL,
        DESCRIPCION NVARCHAR(MAX)  NULL,
        ACTIVO      BIT            NOT NULL DEFAULT 1,
        FECHA_CREA  DATETIME       NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_HAB_AREA FOREIGN KEY (ID_AREA) REFERENCES AREA(ID)
    );
    PRINT 'Tabla HABITACION creada';
END
GO

-- 4. Agregar columnas polimorficas a ORDEN_TRAB
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ORDEN_TRAB' AND COLUMN_NAME = 'TIPO_ENTIDAD')
BEGIN
    ALTER TABLE ORDEN_TRAB ADD TIPO_ENTIDAD VARCHAR(20) NOT NULL DEFAULT 'activo';
    ALTER TABLE ORDEN_TRAB ADD ID_ENTIDAD VARCHAR(50) NULL;
    PRINT 'ORDEN_TRAB: columnas polimorficas agregadas';
END
GO
UPDATE ORDEN_TRAB SET ID_ENTIDAD = ID_ACTIVO WHERE ID_ACTIVO IS NOT NULL AND ID_ENTIDAD IS NULL;
PRINT 'ORDEN_TRAB: ID_ENTIDAD poblado desde ID_ACTIVO';
GO

-- 5. Agregar columnas polimorficas a TICKET_MANT
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TICKET_MANT' AND COLUMN_NAME = 'TIPO_ENTIDAD')
BEGIN
    ALTER TABLE TICKET_MANT ADD TIPO_ENTIDAD VARCHAR(20) NOT NULL DEFAULT 'activo';
    ALTER TABLE TICKET_MANT ADD ID_ENTIDAD VARCHAR(50) NULL;
    PRINT 'TICKET_MANT: columnas polimorficas agregadas';
END
GO
UPDATE TICKET_MANT SET ID_ENTIDAD = ID_ACTIVO WHERE ID_ACTIVO IS NOT NULL AND ID_ENTIDAD IS NULL;
PRINT 'TICKET_MANT: ID_ENTIDAD poblado desde ID_ACTIVO';
GO

-- 6. Eliminar FK constraints de ID_ACTIVO (buscar dinamicamente por nombre)
DECLARE @fk_name NVARCHAR(200);

-- ORDEN_TRAB
SELECT @fk_name = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'ORDEN_TRAB' AND c.name = 'ID_ACTIVO';

IF @fk_name IS NOT NULL
BEGIN
    EXEC('ALTER TABLE ORDEN_TRAB DROP CONSTRAINT ' + @fk_name);
    PRINT 'FK de ORDEN_TRAB.ID_ACTIVO eliminada: ' + @fk_name;
END

-- TICKET_MANT
SET @fk_name = NULL;
SELECT @fk_name = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_column_id = c.column_id AND fkc.parent_object_id = c.object_id
WHERE OBJECT_NAME(fk.parent_object_id) = 'TICKET_MANT' AND c.name = 'ID_ACTIVO';

IF @fk_name IS NOT NULL
BEGIN
    EXEC('ALTER TABLE TICKET_MANT DROP CONSTRAINT ' + @fk_name);
    PRINT 'FK de TICKET_MANT.ID_ACTIVO eliminada: ' + @fk_name;
END
GO

-- 7. Hacer ID_ACTIVO nullable en ambas tablas (si no lo es ya)
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ORDEN_TRAB' AND COLUMN_NAME = 'ID_ACTIVO' AND IS_NULLABLE = 'NO')
BEGIN
    ALTER TABLE ORDEN_TRAB ALTER COLUMN ID_ACTIVO VARCHAR(50) NULL;
    PRINT 'ORDEN_TRAB.ID_ACTIVO ahora es nullable';
END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TICKET_MANT' AND COLUMN_NAME = 'ID_ACTIVO' AND IS_NULLABLE = 'NO')
BEGIN
    ALTER TABLE TICKET_MANT ALTER COLUMN ID_ACTIVO VARCHAR(50) NULL;
    PRINT 'TICKET_MANT.ID_ACTIVO ahora es nullable';
END
GO

PRINT '=== Migracion de Tipos de Entidad completada ===';
