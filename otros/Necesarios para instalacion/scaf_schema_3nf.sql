-- ============================================================
--  SCAF - Sistema de Control de Activos Fijos
--  Esquema Relacional 3NF (v3 - PKs corregidas)
--  Motor: Microsoft SQL Server
--  PKs  : INT IDENTITY para catálogos de sistema (ESTADO_ACTIVO, FORMA_PAGO)
--          VARCHAR para entidades de negocio definidas por el usuario
--          INT IDENTITY para tablas de log/trazabilidad
-- ============================================================

-- ============================================================
--  CREAR BASE DE DATOS (si no existe)
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SCAF')
BEGIN
    CREATE DATABASE SCAF
        COLLATE Modern_Spanish_CI_AS;
    PRINT 'Base de datos SCAF creada.';
END
ELSE
    PRINT 'Base de datos SCAF ya existe — continuando...';
GO

USE SCAF;
GO

-- ============================================================
--  LIMPIEZA SEGURA (orden inverso a FK — incluye tablas de versiones anteriores)
-- ============================================================
-- Tablas de versiones anteriores del esquema (v1 con INT IDENTITY)
IF OBJECT_ID('ROL_PERMISO',    'U') IS NOT NULL DROP TABLE ROL_PERMISO;
IF OBJECT_ID('PERMISO',        'U') IS NOT NULL DROP TABLE PERMISO;
IF OBJECT_ID('ASIGNACION',     'U') IS NOT NULL DROP TABLE ASIGNACION;
IF OBJECT_ID('ACTIVO_ADJUNTO', 'U') IS NOT NULL DROP TABLE ACTIVO_ADJUNTO;
-- Tablas actuales (orden inverso a dependencias FK)
IF OBJECT_ID('AUDITORIA',      'U') IS NOT NULL DROP TABLE AUDITORIA;
IF OBJECT_ID('REPROGRAMACION', 'U') IS NOT NULL DROP TABLE REPROGRAMACION;
IF OBJECT_ID('TAREA_TICKET',   'U') IS NOT NULL DROP TABLE TAREA_TICKET;
IF OBJECT_ID('TICKET_MANT',    'U') IS NOT NULL DROP TABLE TICKET_MANT;
IF OBJECT_ID('ORDEN_TRAB',     'U') IS NOT NULL DROP TABLE ORDEN_TRAB;
IF OBJECT_ID('TAREA_PLAN',     'U') IS NOT NULL DROP TABLE TAREA_PLAN;
IF OBJECT_ID('PLAN_MANT',      'U') IS NOT NULL DROP TABLE PLAN_MANT;
IF OBJECT_ID('MOVIMIENTO',     'U') IS NOT NULL DROP TABLE MOVIMIENTO;
IF OBJECT_ID('ACTIVO',         'U') IS NOT NULL DROP TABLE ACTIVO;
IF OBJECT_ID('PROVEEDOR',      'U') IS NOT NULL DROP TABLE PROVEEDOR;
IF OBJECT_ID('FORMA_PAGO',     'U') IS NOT NULL DROP TABLE FORMA_PAGO;
IF OBJECT_ID('ESTADO_ACTIVO',  'U') IS NOT NULL DROP TABLE ESTADO_ACTIVO;
IF OBJECT_ID('TIPO_MANT',      'U') IS NOT NULL DROP TABLE TIPO_MANT;
IF OBJECT_ID('UNIDAD_ORG',     'U') IS NOT NULL DROP TABLE UNIDAD_ORG;
IF OBJECT_ID('CATEGORIA',      'U') IS NOT NULL DROP TABLE CATEGORIA;
IF OBJECT_ID('USUARIO',        'U') IS NOT NULL DROP TABLE USUARIO;
IF OBJECT_ID('ROL',            'U') IS NOT NULL DROP TABLE ROL;
IF OBJECT_ID('CONFIG_EMP',     'U') IS NOT NULL DROP TABLE CONFIG_EMP;
GO

-- ============================================================
--  DOMINIO 1: CONFIGURACIÓN CORPORATIVA
-- ============================================================
CREATE TABLE CONFIG_EMP (
    ID              INT              NOT NULL CONSTRAINT PK_CONFIG_EMP   PRIMARY KEY DEFAULT 1,
    NOMBRE          VARCHAR(200)     NOT NULL DEFAULT 'Mi Empresa S.A.',
    NIT             VARCHAR(50)      NULL,
    CORREO          VARCHAR(150)     NULL,
    TEL             VARCHAR(50)      NULL,
    DIR             VARCHAR(500)     NULL,
    MONEDA          VARCHAR(10)      NOT NULL DEFAULT 'USD',
    MONEDA_SIMBOLO  VARCHAR(5)       NOT NULL DEFAULT '$',
    TEMA            VARCHAR(10)      NOT NULL DEFAULT 'light',
    DIAS_ALERTA_MANT  SMALLINT       NOT NULL DEFAULT 15,
    ITEMS_POR_PAGINA  SMALLINT       NOT NULL DEFAULT 50,
    PERMITIR_BORRADO  BIT            NOT NULL DEFAULT 1,
    FEC_ACT         DATETIME         NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 2: SEGURIDAD Y ACCESO
-- ============================================================

-- Roles del sistema (PK VARCHAR semántico: 'SUPERADMIN', 'GESTOR', etc.)
CREATE TABLE ROL (
    ID          VARCHAR(50)      NOT NULL CONSTRAINT PK_ROL      PRIMARY KEY,
    NOMBRE      VARCHAR(100)     NOT NULL,
    DESCRIPCION VARCHAR(255)     NULL,
    PERMISOS    NVARCHAR(MAX)    NOT NULL DEFAULT '[]',  -- JSON array de permisos
    ACTIVO      BIT              NOT NULL DEFAULT 1,
    FECHA_CREA  DATETIME         NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Usuarios del sistema (PK VARCHAR: 'USR-001', etc. — código visible al usuario)
CREATE TABLE USUARIO (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_USUARIO   PRIMARY KEY,
    ID_ROL        VARCHAR(50)    NULL     CONSTRAINT FK_USR_ROL   FOREIGN KEY REFERENCES ROL(ID),
    NOMBRE        VARCHAR(100)   NOT NULL,
    USERNAME      VARCHAR(50)    NULL     CONSTRAINT UQ_USR_USERNAME UNIQUE,
    CORREO        VARCHAR(150)   NULL     CONSTRAINT UQ_USR_CORREO   UNIQUE,
    PASSWORD_HASH VARCHAR(255)   NULL,
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT     DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 3: CATÁLOGOS / FICHEROS
-- ============================================================

-- Árbol de categorías (PK VARCHAR: código definido por el usuario, p.ej. 'CAT-001')
CREATE TABLE CATEGORIA (
    ID          VARCHAR(50)    NOT NULL CONSTRAINT PK_CATEGORIA  PRIMARY KEY,
    NOMBRE      VARCHAR(100)   NOT NULL,
    ID_PADRE    VARCHAR(50)    NULL,
    DESCRIPCION VARCHAR(255)   NULL
);
ALTER TABLE CATEGORIA
    ADD CONSTRAINT FK_CAT_PADRE FOREIGN KEY (ID_PADRE) REFERENCES CATEGORIA(ID);
GO

-- Árbol organizacional: Sede → Departamento → Área (PK VARCHAR: código del usuario)
CREATE TABLE UNIDAD_ORG (
    ID       VARCHAR(50)    NOT NULL CONSTRAINT PK_UNIDAD_ORG  PRIMARY KEY,
    NOMBRE   VARCHAR(100)   NOT NULL,
    ID_PADRE VARCHAR(50)    NULL,
    TIPO     VARCHAR(20)    NULL
);
ALTER TABLE UNIDAD_ORG
    ADD CONSTRAINT FK_ORG_PADRE FOREIGN KEY (ID_PADRE) REFERENCES UNIDAD_ORG(ID);
GO

-- Tipos de mantenimiento con jerarquía (PK VARCHAR: código del usuario, p.ej. 'TM-PREV')
CREATE TABLE TIPO_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_TIPO_MANT  PRIMARY KEY,
    NOMBRE        VARCHAR(100)   NOT NULL,
    ID_PADRE      VARCHAR(50)    NULL,
    ES_PREVENTIVO BIT            NOT NULL DEFAULT 1,
    DESCRIPCION   VARCHAR(255)   NULL
);
ALTER TABLE TIPO_MANT
    ADD CONSTRAINT FK_TM_PADRE FOREIGN KEY (ID_PADRE) REFERENCES TIPO_MANT(ID);
GO

-- Estados posibles de un activo (PK INT IDENTITY — generado por el sistema)
-- NOMBRE es único y es lo que se muestra al usuario
CREATE TABLE ESTADO_ACTIVO (
    ID     INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_ESTADO_ACTIVO PRIMARY KEY,
    NOMBRE VARCHAR(100)   NOT NULL CONSTRAINT UQ_ESTADO_NOMBRE UNIQUE,
    COLOR  VARCHAR(30)    NULL
);
GO

-- Formas de pago (PK INT IDENTITY — generado por el sistema)
-- NOMBRE es único y es lo que se muestra al usuario
CREATE TABLE FORMA_PAGO (
    ID     INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_FORMA_PAGO PRIMARY KEY,
    NOMBRE VARCHAR(80)    NOT NULL CONSTRAINT UQ_FORMA_PAGO_NOMBRE UNIQUE
);
GO

-- Proveedores / Contratistas (PK VARCHAR: código visible al usuario, p.ej. 'PROV-001')
CREATE TABLE PROVEEDOR (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_PROVEEDOR   PRIMARY KEY,
    NOMBRE        VARCHAR(150)   NOT NULL,
    RIF           VARCHAR(50)    NULL,
    CONTACTO      VARCHAR(100)   NULL,
    TEL           VARCHAR(50)    NULL,
    CORREO        VARCHAR(150)   NULL,
    DIR           VARCHAR(255)   NULL,
    ID_FORMA_PAGO INT            NULL CONSTRAINT FK_PROV_FPAGO  FOREIGN KEY REFERENCES FORMA_PAGO(ID),
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 4: ACTIVOS FIJOS
-- ============================================================

-- Inventario principal de activos físicos (PK VARCHAR: 'ACT-001', etc.)
CREATE TABLE ACTIVO (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_ACTIVO      PRIMARY KEY,
    ID_CATEGORIA  VARCHAR(50)    NULL     CONSTRAINT FK_ACT_CAT     FOREIGN KEY REFERENCES CATEGORIA(ID),
    ID_ESTADO     INT            NULL     CONSTRAINT FK_ACT_ESTADO  FOREIGN KEY REFERENCES ESTADO_ACTIVO(ID),
    ID_DEPTO      VARCHAR(50)    NULL     CONSTRAINT FK_ACT_ORG     FOREIGN KEY REFERENCES UNIDAD_ORG(ID),
    ID_CUSTODIO   VARCHAR(50)    NULL     CONSTRAINT FK_ACT_CUST    FOREIGN KEY REFERENCES USUARIO(ID),
    ID_PROVEEDOR  VARCHAR(50)    NULL     CONSTRAINT FK_ACT_PROV    FOREIGN KEY REFERENCES PROVEEDOR(ID),
    NOMBRE        VARCHAR(150)   NOT NULL,
    MARCA         VARCHAR(100)   NULL,
    MODELO        VARCHAR(100)   NULL,
    SERIAL        VARCHAR(100)   NULL,
    FAMILIA       VARCHAR(100)   NULL,
    SUBFAM        VARCHAR(100)   NULL,
    UBICACION     VARCHAR(200)   NULL,
    AREA          VARCHAR(100)   NULL,
    FECHA_INGRESO DATE           NOT NULL DEFAULT CAST(GETUTCDATE() AS DATE),
    COSTO_ADQUIS  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    VALOR_ACTUAL  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    DESCRIPCION   NVARCHAR(MAX)  NULL,
    OBSERVACIONES NVARCHAR(MAX)  NULL,
    FOTO_URL      VARCHAR(500)   NULL,
    FACTURA_URL   VARCHAR(500)   NULL,
    BORRADO       BIT            NOT NULL DEFAULT 0,
    FECHA_BAJA    DATETIME       NULL,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT     DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Historial de movimientos físicos del activo (PK INT IDENTITY)
-- DEPTO y ESTADO se guardan como texto (snapshot histórico inmutable)
CREATE TABLE MOVIMIENTO (
    ID            INT            NOT NULL CONSTRAINT PK_MOVIMIENTO  PRIMARY KEY IDENTITY(1,1),
    ID_ACTIVO     VARCHAR(50)    NOT NULL CONSTRAINT FK_MOV_ACTIVO FOREIGN KEY REFERENCES ACTIVO(ID),
    UBICACION_ANT NVARCHAR(200)  NULL,
    UBICACION_NUE NVARCHAR(200)  NULL,
    DEPTO_ANT     NVARCHAR(200)  NULL,
    DEPTO_NUE     NVARCHAR(200)  NULL,
    AREA_ANT      VARCHAR(100)   NULL,
    AREA_NUE      VARCHAR(100)   NULL,
    ESTADO_ANT    VARCHAR(100)   NULL,
    ESTADO_NUE    VARCHAR(100)   NULL,
    OBSERVACION   NVARCHAR(1000) NOT NULL,
    ID_USUARIO    VARCHAR(50)    NULL,
    NOMBRE_USUARIO VARCHAR(100)  NULL,
    FECHA         DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 5: MANTENIMIENTO
-- ============================================================

-- Planes maestros de mantenimiento (PK VARCHAR)
CREATE TABLE PLAN_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_PLAN_MANT  PRIMARY KEY,
    CODIGO        VARCHAR(50)    NOT NULL CONSTRAINT UQ_PLAN_CODIGO UNIQUE,
    DESCRIPCION   VARCHAR(255)   NOT NULL,
    SUBFAM        VARCHAR(100)   NULL,
    CATEGORIA     VARCHAR(100)   NULL,
    FRECUENCIA    VARCHAR(20)    NOT NULL DEFAULT 'Mensual',
    ID_CATEGORIA  VARCHAR(50)    NULL,
    ID_FAMILIA    VARCHAR(50)    NULL,
    FAM_NOMBRE    VARCHAR(100)   NULL,
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Tareas plantilla de cada plan (PK VARCHAR)
CREATE TABLE TAREA_PLAN (
    ID          VARCHAR(50)    NOT NULL CONSTRAINT PK_TAREA_PLAN  PRIMARY KEY,
    ID_PLAN     VARCHAR(50)    NOT NULL CONSTRAINT FK_TP_PLAN     FOREIGN KEY REFERENCES PLAN_MANT(ID),
    DESCRIPCION NVARCHAR(MAX)  NOT NULL,
    FRECUENCIA  VARCHAR(20)    NOT NULL DEFAULT 'Mensual',
    ORDEN       TINYINT        NOT NULL DEFAULT 1,
    ACTIVO      BIT            NOT NULL DEFAULT 1
);
GO

-- Órdenes de trabajo (PK VARCHAR)
CREATE TABLE ORDEN_TRAB (
    ID           VARCHAR(50)    NOT NULL CONSTRAINT PK_ORDEN_TRAB  PRIMARY KEY,
    ID_PLAN      VARCHAR(50)    NULL     CONSTRAINT FK_OT_PLAN     FOREIGN KEY REFERENCES PLAN_MANT(ID),
    ID_ACTIVO    VARCHAR(50)    NOT NULL CONSTRAINT FK_OT_ACTIVO   FOREIGN KEY REFERENCES ACTIVO(ID),
    ID_ASIGNADO  VARCHAR(50)    NULL     CONSTRAINT FK_OT_ASIG     FOREIGN KEY REFERENCES USUARIO(ID),
    TITULO       VARCHAR(200)   NOT NULL,
    FECHA_INICIO DATE           NOT NULL,
    FECHA_FIN    DATE           NULL,
    NOTAS        NVARCHAR(MAX)  NULL,
    ESTADO       VARCHAR(20)    NOT NULL DEFAULT 'PENDIENTE',
    FECHA_CREA   DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Tickets de mantenimiento (PK VARCHAR: 'MT-001', etc.)
CREATE TABLE TICKET_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_TICKET_MANT PRIMARY KEY,
    ID_ORDEN_TRAB VARCHAR(50)    NULL     CONSTRAINT FK_TK_OT       FOREIGN KEY REFERENCES ORDEN_TRAB(ID),
    ID_ACTIVO     VARCHAR(50)    NOT NULL CONSTRAINT FK_TK_ACTIVO   FOREIGN KEY REFERENCES ACTIVO(ID),
    ID_PLAN       VARCHAR(50)    NULL     CONSTRAINT FK_TK_PLAN     FOREIGN KEY REFERENCES PLAN_MANT(ID),
    ID_TIPO_MANT  VARCHAR(50)    NOT NULL CONSTRAINT FK_TK_TIPO     FOREIGN KEY REFERENCES TIPO_MANT(ID),
    ID_PROVEEDOR  VARCHAR(50)    NULL     CONSTRAINT FK_TK_PROV     FOREIGN KEY REFERENCES PROVEEDOR(ID),
    ID_ASIGNADO   VARCHAR(50)    NULL     CONSTRAINT FK_TK_ASIG     FOREIGN KEY REFERENCES USUARIO(ID),
    TITULO        VARCHAR(200)   NOT NULL,
    FECHA_INICIO  DATE           NOT NULL,
    FECHA_FIN     DATE           NULL,
    ESTADO        VARCHAR(20)    NOT NULL DEFAULT 'PENDIENTE',
    COSTO         DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    DESCRIPCION   NVARCHAR(MAX)  NULL,
    BORRADO       BIT            NOT NULL DEFAULT 0,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT     DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Tareas (checklist) dentro de un ticket (PK INT IDENTITY)
CREATE TABLE TAREA_TICKET (
    ID          INT              NOT NULL IDENTITY(1,1) CONSTRAINT PK_TAREA_TICKET PRIMARY KEY,
    ID_TICKET   VARCHAR(50)      NOT NULL CONSTRAINT FK_TT_TICKET FOREIGN KEY REFERENCES TICKET_MANT(ID),
    DESCRIPCION NVARCHAR(MAX)    NOT NULL,
    COMPLETADO  BIT              NOT NULL DEFAULT 0,
    FECHA_COMP  DATETIME         NULL
);
GO

-- Historial de reprogramaciones (PK INT IDENTITY)
CREATE TABLE REPROGRAMACION (
    ID             INT            NOT NULL CONSTRAINT PK_REPROG      PRIMARY KEY IDENTITY(1,1),
    ID_TICKET      VARCHAR(50)    NOT NULL CONSTRAINT FK_REP_TICKET  FOREIGN KEY REFERENCES TICKET_MANT(ID),
    FECHA_INI_ORI  DATE           NULL,
    FECHA_FIN_ORI  DATE           NULL,
    FECHA_INI_NUE  DATE           NULL,
    FECHA_FIN_NUE  DATE           NULL,
    MOTIVO         NVARCHAR(500)  NOT NULL,
    ID_USUARIO     VARCHAR(50)    NULL,
    NOMBRE_USUARIO VARCHAR(100)   NULL,
    FECHA_CREA     DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 6: AUDITORÍA
-- ============================================================

-- Bitácora inmutable de todas las acciones (PK INT IDENTITY)
CREATE TABLE AUDITORIA (
    ID             INT            NOT NULL CONSTRAINT PK_AUDITORIA   PRIMARY KEY IDENTITY(1,1),
    FECHA          DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    ACCION         VARCHAR(50)    NOT NULL,
    ENTIDAD        VARCHAR(100)   NOT NULL,
    ID_ENTIDAD     VARCHAR(100)   NOT NULL,
    DESCRIPCION    NVARCHAR(MAX)  NULL,
    ID_USUARIO     VARCHAR(50)    NULL,
    NOMBRE_USUARIO VARCHAR(100)   NULL,
    CAMBIOS        NVARCHAR(MAX)  NULL
);
GO

-- ============================================================
--  ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX IX_USUARIO_ROL          ON USUARIO      (ID_ROL);
CREATE INDEX IX_ACTIVO_CAT           ON ACTIVO       (ID_CATEGORIA);
CREATE INDEX IX_ACTIVO_ESTADO        ON ACTIVO       (ID_ESTADO);
CREATE INDEX IX_ACTIVO_DEPTO         ON ACTIVO       (ID_DEPTO);
CREATE INDEX IX_ACTIVO_CUST          ON ACTIVO       (ID_CUSTODIO);
CREATE INDEX IX_ACTIVO_PROV          ON ACTIVO       (ID_PROVEEDOR);
CREATE INDEX IX_ACTIVO_BORRADO       ON ACTIVO       (BORRADO) INCLUDE (ID, NOMBRE, SERIAL, ID_ESTADO);
CREATE INDEX IX_MOV_ACTIVO_FECHA     ON MOVIMIENTO   (ID_ACTIVO, FECHA DESC);
CREATE INDEX IX_PLAN_CAT             ON PLAN_MANT    (ID_CATEGORIA);
CREATE INDEX IX_TAREA_PLAN           ON TAREA_PLAN   (ID_PLAN);
CREATE INDEX IX_OT_ACTIVO            ON ORDEN_TRAB   (ID_ACTIVO);
CREATE INDEX IX_OT_PLAN              ON ORDEN_TRAB   (ID_PLAN);
CREATE INDEX IX_TK_ACTIVO            ON TICKET_MANT  (ID_ACTIVO);
CREATE INDEX IX_TK_PLAN              ON TICKET_MANT  (ID_PLAN);
CREATE INDEX IX_TK_OT                ON TICKET_MANT  (ID_ORDEN_TRAB);
CREATE INDEX IX_TK_ESTADO_FECHA      ON TICKET_MANT  (ESTADO, FECHA_INICIO) WHERE BORRADO = 0;
CREATE INDEX IX_TT_TICKET            ON TAREA_TICKET (ID_TICKET);
CREATE INDEX IX_REP_TICKET           ON REPROGRAMACION (ID_TICKET);
CREATE INDEX IX_AUD_ENTIDAD_FECHA    ON AUDITORIA    (ENTIDAD, FECHA DESC);
CREATE INDEX IX_AUD_USUARIO_FECHA    ON AUDITORIA    (ID_USUARIO, FECHA DESC);
GO

-- ============================================================
--  DATOS BASE (seed mínimo para arrancar el sistema)
-- ============================================================

-- Configuración corporativa inicial
INSERT INTO CONFIG_EMP (ID, NOMBRE, MONEDA, MONEDA_SIMBOLO, TEMA)
VALUES (1, 'Mi Empresa S.A.', 'USD', '$', 'light');
GO

-- Rol SUPERADMIN
INSERT INTO ROL (ID, NOMBRE, DESCRIPCION, PERMISOS)
VALUES ('SUPERADMIN', 'Super Administrador', 'Acceso irrestricto a todo el sistema', '["all"]');
GO

-- Estados de activo por defecto (ID generado automáticamente por IDENTITY)
INSERT INTO ESTADO_ACTIVO (NOMBRE, COLOR) VALUES
('Activo',           '#22c55e'),
('Inactivo',         '#6b7280'),
('En Revisión',      '#f59e0b'),
('En Mantenimiento', '#3b82f6'),
('Retirado',         '#ef4444'),
('Dado de Baja',     '#7c3aed');
GO

-- Tipos de mantenimiento base (PK VARCHAR definido por el usuario)
INSERT INTO TIPO_MANT (ID, NOMBRE, ES_PREVENTIVO, DESCRIPCION) VALUES
('TM-001', 'Preventivo', 1, 'Mantenimiento planificado para prevenir fallas'),
('TM-002', 'Correctivo', 0, 'Reparación tras una falla o avería'),
('TM-003', 'Predictivo', 1, 'Basado en condición/monitoreo continuo');
GO

-- Formas de pago comunes (ID generado automáticamente por IDENTITY)
INSERT INTO FORMA_PAGO (NOMBRE) VALUES
('Efectivo'),
('Transferencia Bancaria'),
('Cheque'),
('Crédito 30 días'),
('Crédito 60 días');
GO

PRINT '============================================================';
PRINT ' Esquema 3NF (v3 - PKs corregidas) creado exitosamente.';
PRINT ' ESTADO_ACTIVO y FORMA_PAGO usan INT IDENTITY(1,1).';
PRINT ' Ejecutar a continuación: node backend/create-superadmin.js';
PRINT '============================================================';
GO