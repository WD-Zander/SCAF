-- ============================================================
-- SCAF — Módulo de Formularios Dinámicos
-- Migración: Tablas FORMULARIO y FORMULARIO_CAMPO
-- ============================================================

-- Tabla principal de formularios
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'FORMULARIO' AND xtype = 'U')
CREATE TABLE FORMULARIO (
  ID            INT IDENTITY(1,1) PRIMARY KEY,
  NOMBRE        NVARCHAR(200) NOT NULL,
  DESCRIPCION   NVARCHAR(500) NULL,
  ACTIVO        BIT DEFAULT 1,
  FECHA_CREA    DATETIME DEFAULT GETDATE(),
  CREADO_POR    NVARCHAR(100) NULL
);

-- Campos / tipos de dato de cada formulario
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'FORMULARIO_CAMPO' AND xtype = 'U')
CREATE TABLE FORMULARIO_CAMPO (
  ID              INT IDENTITY(1,1) PRIMARY KEY,
  ID_FORMULARIO   INT NOT NULL,
  NOMBRE          NVARCHAR(200) NOT NULL,
  TIPO            NVARCHAR(50)  NOT NULL,  -- text, number, date, select, checkbox, textarea
  REQUERIDO       BIT DEFAULT 0,
  OPCIONES        NVARCHAR(MAX) NULL,      -- JSON array para tipo "select" ej: ["Opcion1","Opcion2"]
  ORDEN           INT DEFAULT 0,
  ACTIVO          BIT DEFAULT 1,
  CONSTRAINT FK_CAMPO_FORMULARIO FOREIGN KEY (ID_FORMULARIO) REFERENCES FORMULARIO(ID)
);

-- Tabla para guardar registros (respuestas) de cada formulario
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'FORMULARIO_REGISTRO' AND xtype = 'U')
CREATE TABLE FORMULARIO_REGISTRO (
  ID              INT IDENTITY(1,1) PRIMARY KEY,
  ID_FORMULARIO   INT NOT NULL,
  DATOS           NVARCHAR(MAX) NOT NULL,  -- JSON con las respuestas {campo: valor}
  FECHA_CREA      DATETIME DEFAULT GETDATE(),
  CREADO_POR      NVARCHAR(100) NULL,
  CONSTRAINT FK_REGISTRO_FORMULARIO FOREIGN KEY (ID_FORMULARIO) REFERENCES FORMULARIO(ID)
);
