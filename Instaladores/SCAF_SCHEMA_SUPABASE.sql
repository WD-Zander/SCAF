-- ============================================================
--  SCAF - Sistema de Control de Activos Fijos
--  ESQUEMA PARA SUPABASE (PostgreSQL)
--  Convertido desde SQL Server
--
--  Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
--  LIMPIEZA SEGURA (orden inverso a FK)
-- ============================================================
DROP TABLE IF EXISTS auditoria CASCADE;
DROP TABLE IF EXISTS reprogramacion CASCADE;
DROP TABLE IF EXISTS tarea_ticket CASCADE;
DROP TABLE IF EXISTS ticket_mant CASCADE;
DROP TABLE IF EXISTS orden_trab CASCADE;
DROP TABLE IF EXISTS tarea_plan CASCADE;
DROP TABLE IF EXISTS plan_mant CASCADE;
DROP TABLE IF EXISTS movimiento CASCADE;
DROP TABLE IF EXISTS activo CASCADE;
DROP TABLE IF EXISTS proveedor CASCADE;
DROP TABLE IF EXISTS forma_pago CASCADE;
DROP TABLE IF EXISTS estado_activo CASCADE;
DROP TABLE IF EXISTS tipo_mant CASCADE;
DROP TABLE IF EXISTS unidad_org CASCADE;
DROP TABLE IF EXISTS categoria CASCADE;
DROP TABLE IF EXISTS scope_mant CASCADE;
DROP TABLE IF EXISTS frecuencia_plan CASCADE;
DROP TABLE IF EXISTS motivo_movimiento CASCADE;
DROP TABLE IF EXISTS empleado CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS rol CASCADE;
DROP TABLE IF EXISTS config_emp CASCADE;

-- ============================================================
--  DOMINIO 1: CONFIGURACION CORPORATIVA
-- ============================================================
CREATE TABLE config_emp (
    id               INT              NOT NULL PRIMARY KEY DEFAULT 1,
    nombre           VARCHAR(200)     NOT NULL DEFAULT 'Mi Empresa S.A.',
    nit              VARCHAR(50)      NULL,
    correo           VARCHAR(150)     NULL,
    tel              VARCHAR(50)      NULL,
    dir              VARCHAR(500)     NULL,
    moneda           VARCHAR(10)      NOT NULL DEFAULT 'USD',
    moneda_simbolo   VARCHAR(5)       NOT NULL DEFAULT '$',
    tema             VARCHAR(10)      NOT NULL DEFAULT 'light',
    dias_alerta_mant SMALLINT         NOT NULL DEFAULT 15,
    items_por_pagina SMALLINT         NOT NULL DEFAULT 50,
    permitir_borrado BOOLEAN          NOT NULL DEFAULT TRUE,
    fec_act          TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOMINIO 2: SEGURIDAD Y ACCESO
-- ============================================================
CREATE TABLE rol (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    descripcion VARCHAR(255)  NULL,
    permisos    TEXT          NOT NULL DEFAULT '[]',
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario (
    id            VARCHAR(50)   NOT NULL PRIMARY KEY,
    id_rol        VARCHAR(50)   NULL REFERENCES rol(id),
    nombre        VARCHAR(100)  NOT NULL,
    username      VARCHAR(50)   NULL UNIQUE,
    correo        VARCHAR(150)  NULL UNIQUE,
    password_hash VARCHAR(255)  NULL,
    activo        BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_act     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOMINIO 3: CATALOGOS / FICHEROS
-- ============================================================

CREATE TABLE categoria (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    id_padre    VARCHAR(50)   NULL REFERENCES categoria(id),
    descripcion VARCHAR(255)  NULL,
    id_scope    INT           NULL
);

CREATE TABLE unidad_org (
    id       VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre   VARCHAR(100)  NOT NULL,
    id_padre VARCHAR(50)   NULL REFERENCES unidad_org(id),
    tipo     VARCHAR(20)   NULL
);

CREATE TABLE tipo_mant (
    id            VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre        VARCHAR(100)  NOT NULL,
    id_padre      VARCHAR(50)   NULL REFERENCES tipo_mant(id),
    es_preventivo BOOLEAN       NOT NULL DEFAULT TRUE,
    descripcion   VARCHAR(255)  NULL
);

CREATE TABLE estado_activo (
    id     SERIAL         NOT NULL PRIMARY KEY,
    nombre VARCHAR(100)   NOT NULL UNIQUE,
    color  VARCHAR(30)    NULL
);

CREATE TABLE forma_pago (
    id     SERIAL         NOT NULL PRIMARY KEY,
    nombre VARCHAR(80)    NOT NULL UNIQUE
);

CREATE TABLE proveedor (
    id            VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre        VARCHAR(150)  NOT NULL,
    rif           VARCHAR(50)   NULL,
    contacto      VARCHAR(100)  NULL,
    tel           VARCHAR(50)   NULL,
    correo        VARCHAR(150)  NULL,
    dir           VARCHAR(255)  NULL,
    id_forma_pago INT           NULL REFERENCES forma_pago(id),
    activo        BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE scope_mant (
    id            SERIAL       NOT NULL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    slug          VARCHAR(50)  NOT NULL UNIQUE,
    color         VARCHAR(50)  NOT NULL DEFAULT '#3b82f6',
    icono         VARCHAR(50)  NOT NULL DEFAULT 'Wrench',
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    orden         INT          NOT NULL DEFAULT 99,
    tipo_entidad  VARCHAR(50)  DEFAULT 'activo'
);

CREATE TABLE frecuencia_plan (
    id          SERIAL       NOT NULL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NULL,
    veces_ano   INT          NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    orden       INT          NOT NULL DEFAULT 99
);

CREATE TABLE motivo_movimiento (
    id     SERIAL       NOT NULL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE empleado (
    id        SERIAL        NOT NULL PRIMARY KEY,
    nombre    VARCHAR(100)  NOT NULL,
    apellido  VARCHAR(100)  NOT NULL,
    cedula    VARCHAR(30)   NOT NULL UNIQUE,
    id_depto  VARCHAR(50)   NULL,
    cargo     VARCHAR(150)  NOT NULL DEFAULT '',
    activo    BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_reg TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOMINIO 4: ACTIVOS FIJOS
-- ============================================================
CREATE TABLE activo (
    id            VARCHAR(50)    NOT NULL PRIMARY KEY,
    id_categoria  VARCHAR(50)    NULL REFERENCES categoria(id),
    id_seccion    VARCHAR(50)    NULL REFERENCES categoria(id),
    id_familia    VARCHAR(50)    NULL REFERENCES categoria(id),
    id_subfamilia VARCHAR(50)    NULL REFERENCES categoria(id),
    id_estado     INT            NULL REFERENCES estado_activo(id),
    id_depto      VARCHAR(50)    NULL REFERENCES unidad_org(id),
    id_custodio   VARCHAR(50)    NULL REFERENCES usuario(id),
    id_proveedor  VARCHAR(50)    NULL REFERENCES proveedor(id),
    nombre        VARCHAR(150)   NOT NULL,
    marca         VARCHAR(100)   NULL,
    modelo        VARCHAR(100)   NULL,
    serial        VARCHAR(100)   NULL,
    familia       VARCHAR(100)   NULL,
    subfam        VARCHAR(100)   NULL,
    ubicacion     VARCHAR(200)   NULL,
    area          VARCHAR(100)   NULL,
    fecha_ingreso DATE           NOT NULL DEFAULT CURRENT_DATE,
    costo_adquis  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    valor_actual  DECIMAL(18,2)  NOT NULL DEFAULT 0.00,
    descripcion   TEXT           NULL,
    observaciones TEXT           NULL,
    foto_url      VARCHAR(500)   NULL,
    factura_url   VARCHAR(500)   NULL,
    borrado       BOOLEAN        NOT NULL DEFAULT FALSE,
    fecha_baja    TIMESTAMPTZ    NULL,
    fecha_crea    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    fecha_act     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE movimiento (
    id             SERIAL         NOT NULL PRIMARY KEY,
    id_activo      VARCHAR(50)    NOT NULL REFERENCES activo(id),
    ubicacion_ant  VARCHAR(200)   NULL,
    ubicacion_nue  VARCHAR(200)   NULL,
    depto_ant      VARCHAR(200)   NULL,
    depto_nue      VARCHAR(200)   NULL,
    area_ant       VARCHAR(100)   NULL,
    area_nue       VARCHAR(100)   NULL,
    estado_ant     VARCHAR(100)   NULL,
    estado_nue     VARCHAR(100)   NULL,
    observacion    VARCHAR(1000)  NOT NULL,
    id_motivo      INT            NULL REFERENCES motivo_movimiento(id),
    id_usuario     VARCHAR(50)    NULL,
    nombre_usuario VARCHAR(100)   NULL,
    fecha          TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOMINIO 5: MANTENIMIENTO
-- ============================================================

CREATE TABLE plan_mant (
    id            VARCHAR(50)   NOT NULL PRIMARY KEY,
    codigo        VARCHAR(50)   NOT NULL UNIQUE,
    descripcion   VARCHAR(255)  NOT NULL,
    subfam        VARCHAR(100)  NULL,
    categoria     VARCHAR(100)  NULL,
    frecuencia    VARCHAR(20)   NOT NULL DEFAULT 'Mensual',
    id_categoria  VARCHAR(50)   NULL,
    id_familia    VARCHAR(50)   NULL,
    fam_nombre    VARCHAR(100)  NULL,
    id_scope      INT           NULL,
    activo        BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE tarea_plan (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    id_plan     VARCHAR(50)   NOT NULL REFERENCES plan_mant(id),
    descripcion TEXT          NOT NULL,
    frecuencia  VARCHAR(20)   NOT NULL DEFAULT 'Mensual',
    orden       SMALLINT      NOT NULL DEFAULT 1,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE orden_trab (
    id           VARCHAR(50)   NOT NULL PRIMARY KEY,
    id_plan      VARCHAR(50)   NULL REFERENCES plan_mant(id),
    id_activo    VARCHAR(50)   NOT NULL REFERENCES activo(id),
    tipo_entidad VARCHAR(50)   DEFAULT 'activo',
    id_entidad   VARCHAR(50)   NULL,
    id_asignado  VARCHAR(50)   NULL REFERENCES usuario(id),
    id_scope     INT           NULL,
    titulo       VARCHAR(200)  NOT NULL,
    fecha_inicio DATE          NOT NULL,
    fecha_fin    DATE          NULL,
    notas        TEXT          NULL,
    estado       VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    fecha_crea   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_act    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE ticket_mant (
    id            VARCHAR(50)   NOT NULL PRIMARY KEY,
    id_orden_trab VARCHAR(50)   NULL REFERENCES orden_trab(id),
    id_activo     VARCHAR(50)   NOT NULL REFERENCES activo(id),
    tipo_entidad  VARCHAR(50)   DEFAULT 'activo',
    id_entidad    VARCHAR(50)   NULL,
    id_plan       VARCHAR(50)   NULL REFERENCES plan_mant(id),
    id_tipo_mant  VARCHAR(50)   NOT NULL REFERENCES tipo_mant(id),
    id_proveedor  VARCHAR(50)   NULL REFERENCES proveedor(id),
    id_asignado   VARCHAR(50)   NULL REFERENCES usuario(id),
    id_scope      INT           NULL,
    titulo        VARCHAR(200)  NOT NULL,
    fecha_inicio  DATE          NOT NULL,
    fecha_fin     DATE          NULL,
    estado        VARCHAR(20)   NOT NULL DEFAULT 'PENDIENTE',
    costo         DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    descripcion   TEXT          NULL,
    borrado       BOOLEAN       NOT NULL DEFAULT FALSE,
    fecha_crea    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_act     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE tarea_ticket (
    id          SERIAL        NOT NULL PRIMARY KEY,
    id_ticket   VARCHAR(50)   NOT NULL REFERENCES ticket_mant(id),
    descripcion TEXT          NOT NULL,
    completado  BOOLEAN       NOT NULL DEFAULT FALSE,
    fecha_comp  TIMESTAMPTZ   NULL
);

CREATE TABLE reprogramacion (
    id             SERIAL        NOT NULL PRIMARY KEY,
    id_ticket      VARCHAR(50)   NOT NULL REFERENCES ticket_mant(id),
    fecha_ini_ori  DATE          NULL,
    fecha_fin_ori  DATE          NULL,
    fecha_ini_nue  DATE          NULL,
    fecha_fin_nue  DATE          NULL,
    motivo         VARCHAR(500)  NOT NULL,
    id_usuario     VARCHAR(50)   NULL,
    nombre_usuario VARCHAR(100)  NULL,
    fecha_crea     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
--  DOMINIO 6: AUDITORIA
-- ============================================================
CREATE TABLE auditoria (
    id             SERIAL        NOT NULL PRIMARY KEY,
    fecha          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    accion         VARCHAR(50)   NOT NULL,
    entidad        VARCHAR(100)  NOT NULL,
    id_entidad     VARCHAR(100)  NOT NULL,
    descripcion    TEXT          NULL,
    id_usuario     VARCHAR(50)   NULL,
    nombre_usuario VARCHAR(100)  NULL,
    cambios        TEXT          NULL
);

-- ============================================================
--  INDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX ix_usuario_rol          ON usuario        (id_rol);
CREATE INDEX ix_activo_cat           ON activo         (id_categoria);
CREATE INDEX ix_activo_estado        ON activo         (id_estado);
CREATE INDEX ix_activo_depto         ON activo         (id_depto);
CREATE INDEX ix_activo_cust          ON activo         (id_custodio);
CREATE INDEX ix_activo_prov          ON activo         (id_proveedor);
CREATE INDEX ix_activo_borrado       ON activo         (borrado);
CREATE INDEX ix_mov_activo_fecha     ON movimiento     (id_activo, fecha DESC);
CREATE INDEX ix_plan_cat             ON plan_mant      (id_categoria);
CREATE INDEX ix_tarea_plan           ON tarea_plan     (id_plan);
CREATE INDEX ix_ot_activo            ON orden_trab     (id_activo);
CREATE INDEX ix_ot_plan              ON orden_trab     (id_plan);
CREATE INDEX ix_tk_activo            ON ticket_mant    (id_activo);
CREATE INDEX ix_tk_plan              ON ticket_mant    (id_plan);
CREATE INDEX ix_tk_ot                ON ticket_mant    (id_orden_trab);
CREATE INDEX ix_tk_estado_fecha      ON ticket_mant    (estado, fecha_inicio) WHERE borrado = FALSE;
CREATE INDEX ix_tt_ticket            ON tarea_ticket   (id_ticket);
CREATE INDEX ix_rep_ticket           ON reprogramacion (id_ticket);
CREATE INDEX ix_aud_entidad_fecha    ON auditoria      (entidad, fecha DESC);
CREATE INDEX ix_aud_usuario_fecha    ON auditoria      (id_usuario, fecha DESC);

-- ============================================================
--  DATOS BASE (seed minimo para arrancar)
-- ============================================================

INSERT INTO config_emp (id, nombre, moneda, moneda_simbolo, tema)
VALUES (1, 'Mi Empresa S.A.', 'USD', '$', 'light');

INSERT INTO rol (id, nombre, descripcion, permisos)
VALUES ('SUPERADMIN', 'Super Administrador', 'Acceso irrestricto a todo el sistema', '["all"]');

INSERT INTO estado_activo (nombre, color) VALUES
('Activo',           '#22c55e'),
('Inactivo',         '#6b7280'),
('En Revision',      '#f59e0b'),
('En Mantenimiento', '#3b82f6'),
('Retirado',         '#ef4444'),
('Dado de Baja',     '#7c3aed');

INSERT INTO tipo_mant (id, nombre, es_preventivo, descripcion) VALUES
('TM-001', 'Mantenimiento Preventivo Base de Activos Fijos', TRUE,  'Mantenimiento planificado para prevenir fallas'),
('TM-002', 'Mantenimiento Correctivo Programado',            FALSE, 'Reparacion correctiva programada'),
('TM-003', 'Mantenimiento Correctivo',                       FALSE, 'Reparacion tras una falla o averia');

INSERT INTO forma_pago (nombre) VALUES
('Efectivo'), ('Transferencia Bancaria'), ('Cheque'), ('Credito 30 dias'), ('Credito 60 dias');

INSERT INTO scope_mant (nombre, slug, color, icono, orden) VALUES
('Mantenimientos de Area',        'area',       '#3b82f6', 'MapPin',   1),
('Mantenimiento de Habitaciones', 'habitacion', '#22c55e', 'DoorOpen', 2),
('Mantenimiento de Activos',      'activo',     '#eab308', 'Box',      3);

INSERT INTO frecuencia_plan (nombre, descripcion, veces_ano, orden) VALUES
('Diaria',        'Todos los dias (365 veces/ano)',     365, 1),
('Semanal',       'Una vez por semana (52 veces/ano)',    52, 2),
('Quincenal',     'Cada 15 dias (24 veces/ano)',          24, 3),
('Mensual',       'Una vez al mes (12 veces/ano)',        12, 4),
('Bimestral',     'Cada 2 meses (6 veces/ano)',            6, 5),
('Trimestral',    'Cada 3 meses (4 veces/ano)',            4, 6),
('Cuatrimestral', 'Cada 4 meses (3 veces/ano)',            3, 7),
('Semestral',     'Cada 6 meses (2 veces/ano)',            2, 8),
('Anual',         'Una vez al ano (1 vez/ano)',            1, 9);

INSERT INTO motivo_movimiento (nombre) VALUES
('Inventario Inicial'), ('Dado de Baja'), ('Entrada Por Compra'),
('Dano Tecnico'), ('Perdida del Activo'), ('Prestamo'),
('Reposicion'), ('Cambio de Ubicacion'), ('Envio Taller Interno'),
('Envio Taller Externo'), ('Fuera de Servicio');
