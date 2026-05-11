-- ============================================================
--  SCAF - Sistema de Control de Activos Fijos
--  ESQUEMA COMPLETO DE BASE DE DATOS
--  Motor: Microsoft SQL Server 2019+
--  Fecha: Mayo 2026
--
--  Este script crea la BD desde cero con TODAS las tablas,
--  incluyendo migraciones de scope, empleados, frecuencias, etc.
--  Es IDEMPOTENTE: puede ejecutarse multiples veces sin errores.
-- ============================================================

-- ============================================================
--  CREAR BASE DE DATOS
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'SCAF')
BEGIN
    CREATE DATABASE SCAF COLLATE Modern_Spanish_CI_AS;
    PRINT 'Base de datos SCAF creada.';
END
ELSE
    PRINT 'Base de datos SCAF ya existe.';
GO

USE SCAF;
GO

-- ============================================================
--  LIMPIEZA SEGURA (orden inverso a FK)
-- ============================================================
IF OBJECT_ID('AUDITORIA',        'U') IS NOT NULL DROP TABLE AUDITORIA;
IF OBJECT_ID('REPROGRAMACION',   'U') IS NOT NULL DROP TABLE REPROGRAMACION;
IF OBJECT_ID('TAREA_TICKET',     'U') IS NOT NULL DROP TABLE TAREA_TICKET;
IF OBJECT_ID('TICKET_MANT',      'U') IS NOT NULL DROP TABLE TICKET_MANT;
IF OBJECT_ID('ORDEN_TRAB',       'U') IS NOT NULL DROP TABLE ORDEN_TRAB;
IF OBJECT_ID('TAREA_PLAN',       'U') IS NOT NULL DROP TABLE TAREA_PLAN;
IF OBJECT_ID('PLAN_MANT',        'U') IS NOT NULL DROP TABLE PLAN_MANT;
IF OBJECT_ID('MOVIMIENTO',       'U') IS NOT NULL DROP TABLE MOVIMIENTO;
IF OBJECT_ID('ACTIVO',           'U') IS NOT NULL DROP TABLE ACTIVO;
IF OBJECT_ID('PROVEEDOR',        'U') IS NOT NULL DROP TABLE PROVEEDOR;
IF OBJECT_ID('FORMA_PAGO',       'U') IS NOT NULL DROP TABLE FORMA_PAGO;
IF OBJECT_ID('ESTADO_ACTIVO',    'U') IS NOT NULL DROP TABLE ESTADO_ACTIVO;
IF OBJECT_ID('TIPO_MANT',        'U') IS NOT NULL DROP TABLE TIPO_MANT;
IF OBJECT_ID('UNIDAD_ORG',       'U') IS NOT NULL DROP TABLE UNIDAD_ORG;
IF OBJECT_ID('CATEGORIA',        'U') IS NOT NULL DROP TABLE CATEGORIA;
IF OBJECT_ID('SCOPE_MANT',       'U') IS NOT NULL DROP TABLE SCOPE_MANT;
IF OBJECT_ID('FRECUENCIA_PLAN',  'U') IS NOT NULL DROP TABLE FRECUENCIA_PLAN;
IF OBJECT_ID('MOTIVO_MOVIMIENTO','U') IS NOT NULL DROP TABLE MOTIVO_MOVIMIENTO;
IF OBJECT_ID('EMPLEADO',         'U') IS NOT NULL DROP TABLE EMPLEADO;
IF OBJECT_ID('USUARIO',          'U') IS NOT NULL DROP TABLE USUARIO;
IF OBJECT_ID('ROL',              'U') IS NOT NULL DROP TABLE ROL;
IF OBJECT_ID('CONFIG_EMP',       'U') IS NOT NULL DROP TABLE CONFIG_EMP;
GO

-- ============================================================
--  DOMINIO 1: CONFIGURACION CORPORATIVA
-- ============================================================
CREATE TABLE CONFIG_EMP (
    ID              INT              NOT NULL CONSTRAINT PK_CONFIG_EMP PRIMARY KEY DEFAULT 1,
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
CREATE TABLE ROL (
    ID          VARCHAR(50)      NOT NULL CONSTRAINT PK_ROL PRIMARY KEY,
    NOMBRE      VARCHAR(100)     NOT NULL,
    DESCRIPCION VARCHAR(255)     NULL,
    PERMISOS    NVARCHAR(MAX)    NOT NULL DEFAULT '[]',
    ACTIVO      BIT              NOT NULL DEFAULT 1,
    FECHA_CREA  DATETIME         NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE TABLE USUARIO (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_USUARIO PRIMARY KEY,
    ID_ROL        VARCHAR(50)    NULL     CONSTRAINT FK_USR_ROL FOREIGN KEY REFERENCES ROL(ID),
    NOMBRE        VARCHAR(100)   NOT NULL,
    USERNAME      VARCHAR(50)    NULL     CONSTRAINT UQ_USR_USERNAME UNIQUE,
    CORREO        VARCHAR(150)   NULL     CONSTRAINT UQ_USR_CORREO UNIQUE,
    PASSWORD_HASH VARCHAR(255)   NULL,
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT     DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 3: CATALOGOS / FICHEROS
-- ============================================================

-- Arbol de categorias de activos
CREATE TABLE CATEGORIA (
    ID          VARCHAR(50)    NOT NULL CONSTRAINT PK_CATEGORIA PRIMARY KEY,
    NOMBRE      VARCHAR(100)   NOT NULL,
    ID_PADRE    VARCHAR(50)    NULL,
    DESCRIPCION VARCHAR(255)   NULL,
    ID_SCOPE    INT            NULL  -- Vincula categoria raiz con modulo de mantenimiento
);
ALTER TABLE CATEGORIA ADD CONSTRAINT FK_CAT_PADRE FOREIGN KEY (ID_PADRE) REFERENCES CATEGORIA(ID);
GO

-- Arbol organizacional: Sede > Ubicacion > Departamento
CREATE TABLE UNIDAD_ORG (
    ID       VARCHAR(50)    NOT NULL CONSTRAINT PK_UNIDAD_ORG PRIMARY KEY,
    NOMBRE   VARCHAR(100)   NOT NULL,
    ID_PADRE VARCHAR(50)    NULL,
    TIPO     VARCHAR(20)    NULL
);
ALTER TABLE UNIDAD_ORG ADD CONSTRAINT FK_ORG_PADRE FOREIGN KEY (ID_PADRE) REFERENCES UNIDAD_ORG(ID);
GO

-- Tipos de mantenimiento (jerarquico)
CREATE TABLE TIPO_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_TIPO_MANT PRIMARY KEY,
    NOMBRE        VARCHAR(100)   NOT NULL,
    ID_PADRE      VARCHAR(50)    NULL,
    ES_PREVENTIVO BIT            NOT NULL DEFAULT 1,
    DESCRIPCION   VARCHAR(255)   NULL
);
ALTER TABLE TIPO_MANT ADD CONSTRAINT FK_TM_PADRE FOREIGN KEY (ID_PADRE) REFERENCES TIPO_MANT(ID);
GO

-- Estados de activo
CREATE TABLE ESTADO_ACTIVO (
    ID     INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_ESTADO_ACTIVO PRIMARY KEY,
    NOMBRE VARCHAR(100)   NOT NULL CONSTRAINT UQ_ESTADO_NOMBRE UNIQUE,
    COLOR  VARCHAR(30)    NULL
);
GO

-- Formas de pago de proveedores
CREATE TABLE FORMA_PAGO (
    ID     INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_FORMA_PAGO PRIMARY KEY,
    NOMBRE VARCHAR(80)    NOT NULL CONSTRAINT UQ_FORMA_PAGO_NOMBRE UNIQUE
);
GO

-- Proveedores / Contratistas
CREATE TABLE PROVEEDOR (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_PROVEEDOR PRIMARY KEY,
    NOMBRE        VARCHAR(150)   NOT NULL,
    RIF           VARCHAR(50)    NULL,
    CONTACTO      VARCHAR(100)   NULL,
    TEL           VARCHAR(50)    NULL,
    CORREO        VARCHAR(150)   NULL,
    DIR           VARCHAR(255)   NULL,
    ID_FORMA_PAGO INT            NULL CONSTRAINT FK_PROV_FPAGO FOREIGN KEY REFERENCES FORMA_PAGO(ID),
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Modulos de mantenimiento (scopes)
CREATE TABLE SCOPE_MANT (
    ID      INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE  NVARCHAR(100) NOT NULL,
    SLUG    NVARCHAR(50)  NOT NULL UNIQUE,
    COLOR   NVARCHAR(50)  NOT NULL DEFAULT '#3b82f6',
    ICONO   NVARCHAR(50)  NOT NULL DEFAULT 'Wrench',
    ACTIVO  BIT           NOT NULL DEFAULT 1,
    ORDEN   INT           NOT NULL DEFAULT 99
);
GO

-- Frecuencias de plan
CREATE TABLE FRECUENCIA_PLAN (
    ID          INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE      NVARCHAR(100) NOT NULL UNIQUE,
    DESCRIPCION NVARCHAR(200) NULL,
    VECES_ANO   INT           NULL,
    ACTIVO      BIT           NOT NULL DEFAULT 1,
    ORDEN       INT           NOT NULL DEFAULT 99
);
GO

-- Motivos de movimiento
CREATE TABLE MOTIVO_MOVIMIENTO (
    ID     INT IDENTITY(1,1) PRIMARY KEY,
    NOMBRE NVARCHAR(200) NOT NULL UNIQUE
);
GO

-- Empleados
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
GO

-- ============================================================
--  DOMINIO 4: ACTIVOS FIJOS
-- ============================================================
CREATE TABLE ACTIVO (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_ACTIVO PRIMARY KEY,
    ID_CATEGORIA  VARCHAR(50)    NULL     CONSTRAINT FK_ACT_CAT    FOREIGN KEY REFERENCES CATEGORIA(ID),
    ID_ESTADO     INT            NULL     CONSTRAINT FK_ACT_ESTADO FOREIGN KEY REFERENCES ESTADO_ACTIVO(ID),
    ID_DEPTO      VARCHAR(50)    NULL     CONSTRAINT FK_ACT_ORG    FOREIGN KEY REFERENCES UNIDAD_ORG(ID),
    ID_CUSTODIO   VARCHAR(50)    NULL     CONSTRAINT FK_ACT_CUST   FOREIGN KEY REFERENCES USUARIO(ID),
    ID_PROVEEDOR  VARCHAR(50)    NULL     CONSTRAINT FK_ACT_PROV   FOREIGN KEY REFERENCES PROVEEDOR(ID),
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

-- Historial de movimientos del activo
CREATE TABLE MOVIMIENTO (
    ID             INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_MOVIMIENTO PRIMARY KEY,
    ID_ACTIVO      VARCHAR(50)    NOT NULL CONSTRAINT FK_MOV_ACTIVO FOREIGN KEY REFERENCES ACTIVO(ID),
    UBICACION_ANT  NVARCHAR(200)  NULL,
    UBICACION_NUE  NVARCHAR(200)  NULL,
    DEPTO_ANT      NVARCHAR(200)  NULL,
    DEPTO_NUE      NVARCHAR(200)  NULL,
    AREA_ANT       VARCHAR(100)   NULL,
    AREA_NUE       VARCHAR(100)   NULL,
    ESTADO_ANT     VARCHAR(100)   NULL,
    ESTADO_NUE     VARCHAR(100)   NULL,
    OBSERVACION    NVARCHAR(1000) NOT NULL,
    ID_MOTIVO      INT            NULL CONSTRAINT FK_MOV_MOTIVO FOREIGN KEY REFERENCES MOTIVO_MOVIMIENTO(ID),
    ID_USUARIO     VARCHAR(50)    NULL,
    NOMBRE_USUARIO VARCHAR(100)   NULL,
    FECHA          DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- ============================================================
--  DOMINIO 5: MANTENIMIENTO
-- ============================================================

-- Planes maestros de mantenimiento
CREATE TABLE PLAN_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_PLAN_MANT PRIMARY KEY,
    CODIGO        VARCHAR(50)    NOT NULL CONSTRAINT UQ_PLAN_CODIGO UNIQUE,
    DESCRIPCION   VARCHAR(255)   NOT NULL,
    SUBFAM        VARCHAR(100)   NULL,
    CATEGORIA     VARCHAR(100)   NULL,
    FRECUENCIA    VARCHAR(20)    NOT NULL DEFAULT 'Mensual',
    ID_CATEGORIA  VARCHAR(50)    NULL,
    ID_FAMILIA    VARCHAR(50)    NULL,
    FAM_NOMBRE    VARCHAR(100)   NULL,
    ID_SCOPE      INT            NULL,
    ACTIVO        BIT            NOT NULL DEFAULT 1,
    FECHA_CREA    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Tareas plantilla de cada plan
CREATE TABLE TAREA_PLAN (
    ID          VARCHAR(50)    NOT NULL CONSTRAINT PK_TAREA_PLAN PRIMARY KEY,
    ID_PLAN     VARCHAR(50)    NOT NULL CONSTRAINT FK_TP_PLAN FOREIGN KEY REFERENCES PLAN_MANT(ID),
    DESCRIPCION NVARCHAR(MAX)  NOT NULL,
    FRECUENCIA  VARCHAR(20)    NOT NULL DEFAULT 'Mensual',
    ORDEN       TINYINT        NOT NULL DEFAULT 1,
    ACTIVO      BIT            NOT NULL DEFAULT 1
);
GO

-- Ordenes de trabajo
CREATE TABLE ORDEN_TRAB (
    ID           VARCHAR(50)    NOT NULL CONSTRAINT PK_ORDEN_TRAB PRIMARY KEY,
    ID_PLAN      VARCHAR(50)    NULL     CONSTRAINT FK_OT_PLAN FOREIGN KEY REFERENCES PLAN_MANT(ID),
    ID_ACTIVO    VARCHAR(50)    NOT NULL CONSTRAINT FK_OT_ACTIVO FOREIGN KEY REFERENCES ACTIVO(ID),
    ID_ASIGNADO  VARCHAR(50)    NULL     CONSTRAINT FK_OT_ASIG FOREIGN KEY REFERENCES USUARIO(ID),
    ID_SCOPE     INT            NULL,
    TITULO       VARCHAR(200)   NOT NULL,
    FECHA_INICIO DATE           NOT NULL,
    FECHA_FIN    DATE           NULL,
    NOTAS        NVARCHAR(MAX)  NULL,
    ESTADO       VARCHAR(20)    NOT NULL DEFAULT 'PENDIENTE',
    FECHA_CREA   DATETIME       NOT NULL DEFAULT GETUTCDATE(),
    FECHA_ACT    DATETIME       NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Tickets de mantenimiento
CREATE TABLE TICKET_MANT (
    ID            VARCHAR(50)    NOT NULL CONSTRAINT PK_TICKET_MANT PRIMARY KEY,
    ID_ORDEN_TRAB VARCHAR(50)    NULL     CONSTRAINT FK_TK_OT FOREIGN KEY REFERENCES ORDEN_TRAB(ID),
    ID_ACTIVO     VARCHAR(50)    NOT NULL CONSTRAINT FK_TK_ACTIVO FOREIGN KEY REFERENCES ACTIVO(ID),
    ID_PLAN       VARCHAR(50)    NULL     CONSTRAINT FK_TK_PLAN FOREIGN KEY REFERENCES PLAN_MANT(ID),
    ID_TIPO_MANT  VARCHAR(50)    NOT NULL CONSTRAINT FK_TK_TIPO FOREIGN KEY REFERENCES TIPO_MANT(ID),
    ID_PROVEEDOR  VARCHAR(50)    NULL     CONSTRAINT FK_TK_PROV FOREIGN KEY REFERENCES PROVEEDOR(ID),
    ID_ASIGNADO   VARCHAR(50)    NULL     CONSTRAINT FK_TK_ASIG FOREIGN KEY REFERENCES USUARIO(ID),
    ID_SCOPE      INT            NULL,
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

-- Tareas (checklist) dentro de un ticket
CREATE TABLE TAREA_TICKET (
    ID          INT              NOT NULL IDENTITY(1,1) CONSTRAINT PK_TAREA_TICKET PRIMARY KEY,
    ID_TICKET   VARCHAR(50)      NOT NULL CONSTRAINT FK_TT_TICKET FOREIGN KEY REFERENCES TICKET_MANT(ID),
    DESCRIPCION NVARCHAR(MAX)    NOT NULL,
    COMPLETADO  BIT              NOT NULL DEFAULT 0,
    FECHA_COMP  DATETIME         NULL
);
GO

-- Historial de reprogramaciones
CREATE TABLE REPROGRAMACION (
    ID             INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_REPROG PRIMARY KEY,
    ID_TICKET      VARCHAR(50)    NOT NULL CONSTRAINT FK_REP_TICKET FOREIGN KEY REFERENCES TICKET_MANT(ID),
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
--  DOMINIO 6: AUDITORIA
-- ============================================================
CREATE TABLE AUDITORIA (
    ID             INT            NOT NULL IDENTITY(1,1) CONSTRAINT PK_AUDITORIA PRIMARY KEY,
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
--  INDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX IX_USUARIO_ROL          ON USUARIO        (ID_ROL);
CREATE INDEX IX_ACTIVO_CAT           ON ACTIVO         (ID_CATEGORIA);
CREATE INDEX IX_ACTIVO_ESTADO        ON ACTIVO         (ID_ESTADO);
CREATE INDEX IX_ACTIVO_DEPTO         ON ACTIVO         (ID_DEPTO);
CREATE INDEX IX_ACTIVO_CUST          ON ACTIVO         (ID_CUSTODIO);
CREATE INDEX IX_ACTIVO_PROV          ON ACTIVO         (ID_PROVEEDOR);
CREATE INDEX IX_ACTIVO_BORRADO       ON ACTIVO         (BORRADO) INCLUDE (ID, NOMBRE, SERIAL, ID_ESTADO);
CREATE INDEX IX_MOV_ACTIVO_FECHA     ON MOVIMIENTO     (ID_ACTIVO, FECHA DESC);
CREATE INDEX IX_PLAN_CAT             ON PLAN_MANT      (ID_CATEGORIA);
CREATE INDEX IX_TAREA_PLAN           ON TAREA_PLAN     (ID_PLAN);
CREATE INDEX IX_OT_ACTIVO            ON ORDEN_TRAB     (ID_ACTIVO);
CREATE INDEX IX_OT_PLAN              ON ORDEN_TRAB     (ID_PLAN);
CREATE INDEX IX_TK_ACTIVO            ON TICKET_MANT    (ID_ACTIVO);
CREATE INDEX IX_TK_PLAN              ON TICKET_MANT    (ID_PLAN);
CREATE INDEX IX_TK_OT                ON TICKET_MANT    (ID_ORDEN_TRAB);
CREATE INDEX IX_TK_ESTADO_FECHA      ON TICKET_MANT    (ESTADO, FECHA_INICIO) WHERE BORRADO = 0;
CREATE INDEX IX_TT_TICKET            ON TAREA_TICKET   (ID_TICKET);
CREATE INDEX IX_REP_TICKET           ON REPROGRAMACION (ID_TICKET);
CREATE INDEX IX_AUD_ENTIDAD_FECHA    ON AUDITORIA      (ENTIDAD, FECHA DESC);
CREATE INDEX IX_AUD_USUARIO_FECHA    ON AUDITORIA      (ID_USUARIO, FECHA DESC);
GO

-- ============================================================
--  DATOS BASE (seed minimo para arrancar)
-- ============================================================

-- Configuracion corporativa
INSERT INTO CONFIG_EMP (ID, NOMBRE, MONEDA, MONEDA_SIMBOLO, TEMA)
VALUES (1, 'Mi Empresa S.A.', 'USD', '$', 'light');
GO

-- Rol SUPERADMIN
INSERT INTO ROL (ID, NOMBRE, DESCRIPCION, PERMISOS)
VALUES ('SUPERADMIN', 'Super Administrador', 'Acceso irrestricto a todo el sistema', '["all"]');
GO

-- Estados de activo
INSERT INTO ESTADO_ACTIVO (NOMBRE, COLOR) VALUES
('Activo',           '#22c55e'),
('Inactivo',         '#6b7280'),
('En Revision',      '#f59e0b'),
('En Mantenimiento', '#3b82f6'),
('Retirado',         '#ef4444'),
('Dado de Baja',     '#7c3aed');
GO

-- Tipos de mantenimiento
INSERT INTO TIPO_MANT (ID, NOMBRE, ES_PREVENTIVO, DESCRIPCION) VALUES
('TM-001', 'Mantenimiento Preventivo Base de Activos Fijos', 1, 'Mantenimiento planificado para prevenir fallas'),
('TM-002', 'Mantenimiento Correctivo Programado',            0, 'Reparacion correctiva programada'),
('TM-003', 'Mantenimiento Correctivo',                       0, 'Reparacion tras una falla o averia');
GO

-- Formas de pago
INSERT INTO FORMA_PAGO (NOMBRE) VALUES
('Efectivo'), ('Transferencia Bancaria'), ('Cheque'), ('Credito 30 dias'), ('Credito 60 dias');
GO

-- Modulos de mantenimiento (scopes)
INSERT INTO SCOPE_MANT (NOMBRE, SLUG, COLOR, ICONO, ORDEN) VALUES
(N'Mantenimientos de Area',        'area',       '#3b82f6', 'MapPin',   1),
(N'Mantenimiento de Habitaciones', 'habitacion', '#22c55e', 'DoorOpen', 2),
(N'Mantenimiento de Activos',      'activo',     '#eab308', 'Box',      3);
GO

-- Frecuencias de plan
INSERT INTO FRECUENCIA_PLAN (NOMBRE, DESCRIPCION, VECES_ANO, ORDEN) VALUES
('Diaria',        'Todos los dias (365 veces/ano)',     365, 1),
('Semanal',       'Una vez por semana (52 veces/ano)',    52, 2),
('Quincenal',     'Cada 15 dias (24 veces/ano)',          24, 3),
('Mensual',       'Una vez al mes (12 veces/ano)',        12, 4),
('Bimestral',     'Cada 2 meses (6 veces/ano)',            6, 5),
('Trimestral',    'Cada 3 meses (4 veces/ano)',            4, 6),
('Cuatrimestral', 'Cada 4 meses (3 veces/ano)',            3, 7),
('Semestral',     'Cada 6 meses (2 veces/ano)',            2, 8),
('Anual',         'Una vez al ano (1 vez/ano)',            1, 9);
GO

-- Motivos de movimiento
INSERT INTO MOTIVO_MOVIMIENTO (NOMBRE) VALUES
('Inventario Inicial'), ('Dado de Baja'), ('Entrada Por Compra'),
('Dano Tecnico'), ('Perdida del Activo'), ('Prestamo'),
('Reposicion'), ('Cambio de Ubicacion'), ('Envio Taller Interno'),
('Envio Taller Externo'), ('Fuera de Servicio');
GO

PRINT '============================================================';
PRINT ' SCAF: Esquema completo creado exitosamente.';
PRINT ' Siguiente paso: ejecutar node backend/create-superadmin.js';
PRINT '============================================================';
GO
