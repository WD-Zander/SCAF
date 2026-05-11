USE SCAF_DB;
GO

-- 1. CREACIÓN DE NUEVOS FICHEROS (ESTADOS DE ACTIVO Y FORMAS DE PAGO)
IF OBJECT_ID('ESTADOS_ACTIVO', 'U') IS NULL
CREATE TABLE ESTADOS_ACTIVO (
    ID VARCHAR(50) NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(100) NOT NULL
);

IF OBJECT_ID('FORMAS_PAGO', 'U') IS NULL
CREATE TABLE FORMAS_PAGO (
    ID VARCHAR(50) NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(100) NOT NULL
);

-- 2. ALTERACIÓN DE TABLAS EXISTENTES
-- Añadimos la columna FORMA_PAGO a PROVEEDOR si no existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('PROVEEDOR') AND name = 'FORMA_PAGO')
BEGIN
    ALTER TABLE PROVEEDOR ADD FORMA_PAGO VARCHAR(50) NULL;
END
GO

-- 3. INSERCIÓN DE DATOS BASE PARA LOS FICHEROS
-- Estados de Activo
INSERT INTO ESTADOS_ACTIVO (ID, NOMBRE) VALUES 
('EST-001', 'Activo'),
('EST-002', 'En Mantenimiento'),
('EST-003', 'Dado de Baja');

-- Formas de Pago
INSERT INTO FORMAS_PAGO (ID, NOMBRE) VALUES 
('FP-001', 'Transferencia Bancaria'),
('FP-002', 'Efectivo'),
('FP-003', 'Cheque'),
('FP-004', 'Crédito (30 días)'),
('FP-005', 'Crédito (60 días)');

-- 4. INSERCIÓN DE DATOS DE PRUEBA EN TODOS LOS MÓDULOS (VALIDACIÓN)
-- Categorías
INSERT INTO CATEGORIAS (ID, NOMBRE, ID_PADRE) VALUES 
('CAT-1001', 'Equipos Industriales', NULL),
('CAT-1002', 'Maquinaria Pesada', 'CAT-1001');

-- Organización
INSERT INTO ORG (ID, NOMBRE, ID_PADRE) VALUES 
('ORG-1001', 'Planta Norte', NULL),
('ORG-1002', 'Línea de Ensamblaje', 'ORG-1001');

-- Tipos de Mantenimiento
INSERT INTO TIPOS_MANT (ID, NOMBRE, PREVENTIVO) VALUES 
('TM-1001', 'Lubricación General', 1),
('TM-1002', 'Cambio de Piezas Críticas', 0);

-- Proveedores
INSERT INTO PROVEEDOR (ID, NOMBRE, CONTACTO, TEL, CORREO, DIR, FORMA_PAGO) VALUES 
('PRV-1001', 'Suministros Globales SA', 'Ana Gomez', '555-0101', 'ventas@globales.com', 'Av Principal 123', 'Transferencia Bancaria');

-- Activos
INSERT INTO ACTIVOS (ID, NOMBRE, MARCA, MODELO, SERIAL, ID_CAT, ID_DEP, ESTADO, COSTO_ACQ) VALUES 
('ACT-1001', 'Compresor de Aire Industrial', 'Atlas Copco', 'GA 30', 'SN-AC-8890', 'CAT-1002', 'ORG-1002', 'Activo', 15000.00);

-- Planes de Mantenimiento
INSERT INTO PLANES (ID, CODIGO, DESCRIP, FRECUENCIA) VALUES 
('PLN-1001', 'COMP-01', 'Mantenimiento Preventivo Compresores', 'Mensual');

-- Tareas de Plan
INSERT INTO TAREAS_PLAN (ID, ID_PLAN, TAREA, FRECUENCIA) VALUES 
('TP-1001', 'PLN-1001', 'Revisión de nivel de aceite', 'Mensual'),
('TP-1002', 'PLN-1001', 'Cambio de filtros de aire', 'Trimestral');

-- Ordenes de Trabajo (Work Orders)
INSERT INTO ORDENES_TRAB (ID, NOM_PLAN, ID_ACT, FEC_INI, ESTADO) VALUES 
('WO-1001', 'Mantenimiento Preventivo Compresores', 'ACT-1001', CAST(GETUTCDATE() AS DATE), 'PROGRAMADO');

-- Tickets (Mantenimientos)
INSERT INTO TICKETS (ID, ID_ACT, TITULO, ID_TIPO, ID_OT, FEC_INI, ESTADO) VALUES 
('TCK-1001', 'ACT-1001', 'Revisión Mensual Compresor', 'TM-1001', 'WO-1001', CAST(GETUTCDATE() AS DATE), 'PENDIENTE');

-- Checklists (Tareas del Ticket)
INSERT INTO TAREAS_TICK (ID, ID_TICKET, TAREA, COMPLETADO) VALUES 
('TT-1001', 'TCK-1001', 'Revisión de nivel de aceite', 0),
('TT-1002', 'TCK-1001', 'Cambio de filtros de aire', 0);

PRINT 'Tablas extra de Ficheros creadas, alteradas y datos de prueba insertados con éxito.';
