-- ============================================================
-- SCAF - Tablas y columnas faltantes para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- 1) COLUMNAS FALTANTES EN ACTIVO (clasificación jerárquica)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE activo ADD COLUMN IF NOT EXISTS id_seccion VARCHAR(50) NULL REFERENCES categoria(id);
ALTER TABLE activo ADD COLUMN IF NOT EXISTS id_familia VARCHAR(50) NULL REFERENCES categoria(id);
ALTER TABLE activo ADD COLUMN IF NOT EXISTS id_subfamilia VARCHAR(50) NULL REFERENCES categoria(id);

-- ═══════════════════════════════════════════════════════════════
-- 2) TABLAS FALTANTES (si ya existen no hace nada)
-- ═══════════════════════════════════════════════════════════════

-- AREA
CREATE TABLE IF NOT EXISTS area (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    ubicacion   VARCHAR(200)  NULL,
    piso        VARCHAR(50)   NULL,
    descripcion TEXT          NULL,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- HABITACION
CREATE TABLE IF NOT EXISTS habitacion (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    numero      VARCHAR(50)   NULL,
    id_area     VARCHAR(50)   NULL REFERENCES area(id),
    piso        VARCHAR(50)   NULL,
    tipo        VARCHAR(50)   NULL,
    descripcion TEXT          NULL,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- FORMULARIO
CREATE TABLE IF NOT EXISTS formulario (
    id          SERIAL        NOT NULL PRIMARY KEY,
    nombre      VARCHAR(150)  NOT NULL,
    descripcion TEXT          NULL,
    creado_por  VARCHAR(100)  NULL,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- FORMULARIO_CAMPO
CREATE TABLE IF NOT EXISTS formulario_campo (
    id             SERIAL        NOT NULL PRIMARY KEY,
    id_formulario  INT           NOT NULL REFERENCES formulario(id) ON DELETE CASCADE,
    nombre         VARCHAR(100)  NOT NULL,
    tipo           VARCHAR(50)   NOT NULL DEFAULT 'text',
    requerido      BOOLEAN       NOT NULL DEFAULT FALSE,
    opciones       TEXT          NULL,
    orden          INT           NOT NULL DEFAULT 0,
    activo         BOOLEAN       NOT NULL DEFAULT TRUE
);

-- FORMULARIO_REGISTRO
CREATE TABLE IF NOT EXISTS formulario_registro (
    id             SERIAL        NOT NULL PRIMARY KEY,
    id_formulario  INT           NOT NULL REFERENCES formulario(id) ON DELETE CASCADE,
    datos          TEXT          NOT NULL DEFAULT '{}',
    creado_por     VARCHAR(100)  NULL,
    fecha_crea     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- INFORME
CREATE TABLE IF NOT EXISTS informe (
    id             SERIAL        NOT NULL PRIMARY KEY,
    nombre         VARCHAR(150)  NOT NULL,
    descripcion    TEXT          NULL,
    consulta_sql   TEXT          NULL,
    variables      TEXT          NULL,
    creado_por     VARCHAR(100)  NULL,
    activo         BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    fecha_modifica TIMESTAMPTZ   NULL
);

-- TIPO_INFRAESTRUCTURA
CREATE TABLE IF NOT EXISTS tipo_infraestructura (
    id          SERIAL        NOT NULL PRIMARY KEY,
    slug        VARCHAR(50)   NOT NULL UNIQUE,
    nombre      VARCHAR(100)  NOT NULL,
    prefijo_id  VARCHAR(20)   NULL,
    icono       VARCHAR(50)   NULL DEFAULT 'Box',
    campos      TEXT          NOT NULL DEFAULT '[]',
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- INFRAESTRUCTURA_ITEM
CREATE TABLE IF NOT EXISTS infraestructura_item (
    id          VARCHAR(50)   NOT NULL PRIMARY KEY,
    tipo_slug   VARCHAR(50)   NOT NULL REFERENCES tipo_infraestructura(slug),
    nombre      VARCHAR(150)  NOT NULL,
    datos       TEXT          NOT NULL DEFAULT '{}',
    descripcion TEXT          NULL,
    activo      BOOLEAN       NOT NULL DEFAULT TRUE,
    fecha_crea  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
