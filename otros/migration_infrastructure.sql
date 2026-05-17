-- =====================================================
-- MIGRACION: Sistema Dinámico de Infraestructura
-- Fecha: 2026-05-13
-- Descripcion: Reemplaza tablas fijas AREA/HABITACION
--   con un sistema genérico donde el usuario puede
--   crear tipos de infraestructura desde la UI.
-- =====================================================

-- 1. Crear tabla TIPO_INFRAESTRUCTURA (registro de tipos)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TIPO_INFRAESTRUCTURA')
BEGIN
    CREATE TABLE TIPO_INFRAESTRUCTURA (
        ID          INT             IDENTITY(1,1) PRIMARY KEY,
        SLUG        VARCHAR(50)     NOT NULL UNIQUE,
        NOMBRE      VARCHAR(150)    NOT NULL,
        PREFIJO_ID  VARCHAR(20)     NOT NULL DEFAULT 'INF',
        ICONO       VARCHAR(50)     NULL DEFAULT 'Box',
        CAMPOS      NVARCHAR(MAX)   NOT NULL DEFAULT '[]',  -- JSON array de {key, label, type, options?}
        ACTIVO      BIT             NOT NULL DEFAULT 1,
        FECHA_CREA  DATETIME        NOT NULL DEFAULT GETUTCDATE()
    );
    PRINT 'Tabla TIPO_INFRAESTRUCTURA creada';
END
GO

-- 2. Crear tabla INFRAESTRUCTURA_ITEM (items genéricos)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'INFRAESTRUCTURA_ITEM')
BEGIN
    CREATE TABLE INFRAESTRUCTURA_ITEM (
        ID          VARCHAR(50)     NOT NULL PRIMARY KEY,
        TIPO_SLUG   VARCHAR(50)     NOT NULL,
        NOMBRE      VARCHAR(200)    NOT NULL,
        DATOS       NVARCHAR(MAX)   NULL DEFAULT '{}',  -- JSON con campos dinámicos
        DESCRIPCION NVARCHAR(MAX)   NULL,
        ACTIVO      BIT             NOT NULL DEFAULT 1,
        FECHA_CREA  DATETIME        NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_INFRA_TIPO FOREIGN KEY (TIPO_SLUG) REFERENCES TIPO_INFRAESTRUCTURA(SLUG)
    );
    PRINT 'Tabla INFRAESTRUCTURA_ITEM creada';
END
GO

-- 3. Sembrar tipos predeterminados
IF NOT EXISTS (SELECT 1 FROM TIPO_INFRAESTRUCTURA WHERE SLUG = 'area')
BEGIN
    INSERT INTO TIPO_INFRAESTRUCTURA (SLUG, NOMBRE, PREFIJO_ID, ICONO, CAMPOS)
    VALUES ('area', 'Áreas', 'AREA', 'MapPin',
        '[{"key":"ubicacion","label":"Ubicación","type":"text","placeholder":"Ej: Edificio A"},{"key":"piso","label":"Piso","type":"text","placeholder":"Ej: Planta Baja"}]'
    );
    PRINT 'Tipo "area" sembrado';
END

IF NOT EXISTS (SELECT 1 FROM TIPO_INFRAESTRUCTURA WHERE SLUG = 'habitacion')
BEGIN
    INSERT INTO TIPO_INFRAESTRUCTURA (SLUG, NOMBRE, PREFIJO_ID, ICONO, CAMPOS)
    VALUES ('habitacion', 'Habitaciones', 'HAB', 'DoorOpen',
        '[{"key":"numero","label":"Número","type":"text","placeholder":"Ej: 101"},{"key":"piso","label":"Piso","type":"text","placeholder":"Ej: 1"},{"key":"tipo","label":"Tipo","type":"select","options":["Individual","Doble","Suite","Familiar","Ejecutiva","Estándar","Otro"]}]'
    );
    PRINT 'Tipo "habitacion" sembrado';
END
GO

-- 4. Migrar datos existentes de AREA → INFRAESTRUCTURA_ITEM
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AREA')
BEGIN
    INSERT INTO INFRAESTRUCTURA_ITEM (ID, TIPO_SLUG, NOMBRE, DATOS, DESCRIPCION, ACTIVO, FECHA_CREA)
    SELECT
        ID, 'area', NOMBRE,
        '{"ubicacion":"' + ISNULL(REPLACE(REPLACE(UBICACION, '"', '\"'), '\', '\\'), '') + '","piso":"' + ISNULL(REPLACE(REPLACE(PISO, '"', '\"'), '\', '\\'), '') + '"}',
        DESCRIPCION, ACTIVO, FECHA_CREA
    FROM AREA
    WHERE ID NOT IN (SELECT ID FROM INFRAESTRUCTURA_ITEM WHERE TIPO_SLUG = 'area');
    PRINT 'Datos de AREA migrados';
END
GO

-- 5. Migrar datos existentes de HABITACION → INFRAESTRUCTURA_ITEM
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'HABITACION')
BEGIN
    INSERT INTO INFRAESTRUCTURA_ITEM (ID, TIPO_SLUG, NOMBRE, DATOS, DESCRIPCION, ACTIVO, FECHA_CREA)
    SELECT
        ID, 'habitacion', NOMBRE,
        '{"numero":"' + ISNULL(REPLACE(REPLACE(NUMERO, '"', '\"'), '\', '\\'), '') +
        '","piso":"' + ISNULL(REPLACE(REPLACE(PISO, '"', '\"'), '\', '\\'), '') +
        '","tipo":"' + ISNULL(REPLACE(REPLACE(TIPO, '"', '\"'), '\', '\\'), '') + '"}',
        DESCRIPCION, ACTIVO, FECHA_CREA
    FROM HABITACION
    WHERE ID NOT IN (SELECT ID FROM INFRAESTRUCTURA_ITEM WHERE TIPO_SLUG = 'habitacion');
    PRINT 'Datos de HABITACION migrados';
END
GO

PRINT '=== Migración de Infraestructura Dinámica completada ===';
