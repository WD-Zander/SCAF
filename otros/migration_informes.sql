-- ============================================================
-- SCAF — Módulo de Informes SQL
-- Migración: Tabla INFORME
-- ============================================================

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name = 'INFORME' AND xtype = 'U')
CREATE TABLE INFORME (
  ID              INT IDENTITY(1,1) PRIMARY KEY,
  NOMBRE          NVARCHAR(200) NOT NULL,
  DESCRIPCION     NVARCHAR(500) NULL,
  CONSULTA_SQL    NVARCHAR(MAX) NOT NULL,       -- El query SQL guardado
  VARIABLES       NVARCHAR(MAX) NULL,            -- JSON: [{nombre, tipo, valorDefault}]
  ACTIVO          BIT DEFAULT 1,
  FECHA_CREA      DATETIME DEFAULT GETDATE(),
  FECHA_MODIFICA  DATETIME NULL,
  CREADO_POR      NVARCHAR(100) NULL
);
