-- ============================================================
--  SCAF - Script para exportar TODOS los datos como INSERTs
--  Ejecuta esto en SSMS con: Results to Text (Ctrl+T)
--  Luego copia todo el resultado y guardalo como .sql
-- ============================================================
USE SCAF;
GO

SET NOCOUNT ON;
DECLARE @sql NVARCHAR(MAX), @cols NVARCHAR(MAX), @tbl NVARCHAR(128);

-- ============================================================
--  1. CONFIG_EMP
-- ============================================================
PRINT '-- CONFIG_EMP';
DECLARE cur_config CURSOR FOR SELECT * FROM CONFIG_EMP;
SELECT @cols = '';
SELECT @sql = 'SELECT ''INSERT INTO CONFIG_EMP (ID,NOMBRE,NIT,CORREO,TEL,DIR,MONEDA,MONEDA_SIMBOLO,TEMA,DIAS_ALERTA_MANT,ITEMS_POR_PAGINA,PERMITIR_BORRADO) VALUES ('' +
  CAST(ID AS VARCHAR) + '','' +
  '''''''' + REPLACE(ISNULL(NOMBRE,''''),'''''''','''''''''''') + '''''''' + '','' +
  ISNULL('''''''' + REPLACE(NIT,'''''''','''''''''''') + '''''''',''NULL'') + '','' +
  ISNULL('''''''' + REPLACE(CORREO,'''''''','''''''''''') + '''''''',''NULL'') + '','' +
  ISNULL('''''''' + REPLACE(TEL,'''''''','''''''''''') + '''''''',''NULL'') + '','' +
  ISNULL('''''''' + REPLACE(DIR,'''''''','''''''''''') + '''''''',''NULL'') + '','' +
  '''''''' + MONEDA + '''''''' + '','' +
  '''''''' + MONEDA_SIMBOLO + '''''''' + '','' +
  '''''''' + TEMA + '''''''' + '','' +
  CAST(DIAS_ALERTA_MANT AS VARCHAR) + '','' +
  CAST(ITEMS_POR_PAGINA AS VARCHAR) + '','' +
  CAST(PERMITIR_BORRADO AS VARCHAR) + '');''
FROM CONFIG_EMP';
DEALLOCATE cur_config;
EXEC sp_executesql @sql;
PRINT '';

-- Mejor enfoque: generar INSERTs tabla por tabla de forma simple
-- ============================================================
--  Procedimiento para generar INSERTs automaticamente
-- ============================================================

IF OBJECT_ID('tempdb..#GenerateInserts') IS NOT NULL DROP TABLE #GenerateInserts;
GO

-- Usaremos un approach mas limpio: FOR XML PATH
-- Para cada tabla, generamos los INSERTs

-- ============================================================
--  CONFIG_EMP
-- ============================================================
PRINT '-- ============================================';
PRINT '-- CONFIG_EMP';
PRINT '-- ============================================';
SELECT 'INSERT INTO CONFIG_EMP (ID,NOMBRE,NIT,CORREO,TEL,DIR,MONEDA,MONEDA_SIMBOLO,TEMA,DIAS_ALERTA_MANT,ITEMS_POR_PAGINA,PERMITIR_BORRADO) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(NIT,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(CORREO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(TEL,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(DIR,'''','''''') + '''','NULL') + ','
  + '''' + MONEDA + ''','
  + '''' + MONEDA_SIMBOLO + ''','
  + '''' + TEMA + ''','
  + CAST(DIAS_ALERTA_MANT AS VARCHAR(10)) + ','
  + CAST(ITEMS_POR_PAGINA AS VARCHAR(10)) + ','
  + CAST(PERMITIR_BORRADO AS VARCHAR(1)) + ');'
FROM CONFIG_EMP;

-- ============================================================
--  ROL
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- ROL';
PRINT '-- ============================================';
SELECT 'INSERT INTO ROL (ID,NOMBRE,DESCRIPCION,PERMISOS,ACTIVO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(DESCRIPCION,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(CAST(PERMISOS AS NVARCHAR(MAX)),'''','''''') + ''','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM ROL;

-- ============================================================
--  USUARIO
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- USUARIO';
PRINT '-- ============================================';
SELECT 'INSERT INTO USUARIO (ID,ID_ROL,NOMBRE,USERNAME,CORREO,PASSWORD_HASH,ACTIVO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_ROL,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(USERNAME,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(CORREO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(PASSWORD_HASH,'''','''''') + '''','NULL') + ','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM USUARIO;

-- ============================================================
--  CATEGORIA
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- CATEGORIA';
PRINT '-- ============================================';
SELECT 'INSERT INTO CATEGORIA (ID,NOMBRE,ID_PADRE,DESCRIPCION,ID_SCOPE) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PADRE,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(DESCRIPCION,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_SCOPE AS VARCHAR(10)),'NULL') + ');'
FROM CATEGORIA;

-- ============================================================
--  UNIDAD_ORG
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- UNIDAD_ORG';
PRINT '-- ============================================';
SELECT 'INSERT INTO UNIDAD_ORG (ID,NOMBRE,ID_PADRE,TIPO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PADRE,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(TIPO,'''','''''') + '''','NULL') + ');'
FROM UNIDAD_ORG;

-- ============================================================
--  TIPO_MANT
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- TIPO_MANT';
PRINT '-- ============================================';
SELECT 'INSERT INTO TIPO_MANT (ID,NOMBRE,ID_PADRE,ES_PREVENTIVO,DESCRIPCION) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PADRE,'''','''''') + '''','NULL') + ','
  + CAST(ES_PREVENTIVO AS VARCHAR(1)) + ','
  + ISNULL('''' + REPLACE(DESCRIPCION,'''','''''') + '''','NULL') + ');'
FROM TIPO_MANT;

-- ============================================================
--  ESTADO_ACTIVO (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- ESTADO_ACTIVO';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT ESTADO_ACTIVO ON;';
SELECT 'INSERT INTO ESTADO_ACTIVO (ID,NOMBRE,COLOR) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(COLOR,'''','''''') + '''','NULL') + ');'
FROM ESTADO_ACTIVO;
PRINT 'SET IDENTITY_INSERT ESTADO_ACTIVO OFF;';

-- ============================================================
--  FORMA_PAGO (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- FORMA_PAGO';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT FORMA_PAGO ON;';
SELECT 'INSERT INTO FORMA_PAGO (ID,NOMBRE) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''');'
FROM FORMA_PAGO;
PRINT 'SET IDENTITY_INSERT FORMA_PAGO OFF;';

-- ============================================================
--  PROVEEDOR
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- PROVEEDOR';
PRINT '-- ============================================';
SELECT 'INSERT INTO PROVEEDOR (ID,NOMBRE,RIF,CONTACTO,TEL,CORREO,DIR,ID_FORMA_PAGO,ACTIVO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(RIF,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(CONTACTO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(TEL,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(CORREO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(DIR,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_FORMA_PAGO AS VARCHAR(10)),'NULL') + ','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM PROVEEDOR;

-- ============================================================
--  SCOPE_MANT (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- SCOPE_MANT';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT SCOPE_MANT ON;';
SELECT 'INSERT INTO SCOPE_MANT (ID,NOMBRE,SLUG,COLOR,ICONO,ACTIVO,ORDEN) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + 'N''' + REPLACE(CAST(NOMBRE AS NVARCHAR(100)),'''','''''') + ''','
  + 'N''' + REPLACE(CAST(SLUG AS NVARCHAR(50)),'''','''''') + ''','
  + 'N''' + REPLACE(CAST(COLOR AS NVARCHAR(50)),'''','''''') + ''','
  + 'N''' + REPLACE(CAST(ICONO AS NVARCHAR(50)),'''','''''') + ''','
  + CAST(ACTIVO AS VARCHAR(1)) + ','
  + CAST(ORDEN AS VARCHAR(10)) + ');'
FROM SCOPE_MANT;
PRINT 'SET IDENTITY_INSERT SCOPE_MANT OFF;';

-- ============================================================
--  FRECUENCIA_PLAN (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- FRECUENCIA_PLAN';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT FRECUENCIA_PLAN ON;';
SELECT 'INSERT INTO FRECUENCIA_PLAN (ID,NOMBRE,DESCRIPCION,VECES_ANO,ACTIVO,ORDEN) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + 'N''' + REPLACE(CAST(NOMBRE AS NVARCHAR(100)),'''','''''') + ''','
  + ISNULL('N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(200)),'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(VECES_ANO AS VARCHAR(10)),'NULL') + ','
  + CAST(ACTIVO AS VARCHAR(1)) + ','
  + CAST(ORDEN AS VARCHAR(10)) + ');'
FROM FRECUENCIA_PLAN;
PRINT 'SET IDENTITY_INSERT FRECUENCIA_PLAN OFF;';

-- ============================================================
--  MOTIVO_MOVIMIENTO (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- MOTIVO_MOVIMIENTO';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT MOTIVO_MOVIMIENTO ON;';
SELECT 'INSERT INTO MOTIVO_MOVIMIENTO (ID,NOMBRE) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + 'N''' + REPLACE(CAST(NOMBRE AS NVARCHAR(200)),'''','''''') + ''');'
FROM MOTIVO_MOVIMIENTO;
PRINT 'SET IDENTITY_INSERT MOTIVO_MOVIMIENTO OFF;';

-- ============================================================
--  EMPLEADO (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- EMPLEADO';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT EMPLEADO ON;';
SELECT 'INSERT INTO EMPLEADO (ID,NOMBRE,APELLIDO,CEDULA,ID_DEPTO,CARGO,ACTIVO) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + 'N''' + REPLACE(CAST(NOMBRE AS NVARCHAR(100)),'''','''''') + ''','
  + 'N''' + REPLACE(CAST(APELLIDO AS NVARCHAR(100)),'''','''''') + ''','
  + '''' + REPLACE(CEDULA,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_DEPTO,'''','''''') + '''','NULL') + ','
  + 'N''' + REPLACE(CAST(CARGO AS NVARCHAR(150)),'''','''''') + ''','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM EMPLEADO;
PRINT 'SET IDENTITY_INSERT EMPLEADO OFF;';

-- ============================================================
--  ACTIVO
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- ACTIVO';
PRINT '-- ============================================';
SELECT 'INSERT INTO ACTIVO (ID,ID_CATEGORIA,ID_ESTADO,ID_DEPTO,ID_CUSTODIO,ID_PROVEEDOR,NOMBRE,MARCA,MODELO,SERIAL,FAMILIA,SUBFAM,UBICACION,AREA,FECHA_INGRESO,COSTO_ADQUIS,VALOR_ACTUAL,DESCRIPCION,OBSERVACIONES,FOTO_URL,FACTURA_URL,BORRADO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_CATEGORIA,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_ESTADO AS VARCHAR(10)),'NULL') + ','
  + ISNULL('''' + REPLACE(ID_DEPTO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ID_CUSTODIO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ID_PROVEEDOR,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(NOMBRE,'''','''''') + ''','
  + ISNULL('''' + REPLACE(MARCA,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(MODELO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(SERIAL,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(FAMILIA,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(SUBFAM,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(UBICACION,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(AREA,'''','''''') + '''','NULL') + ','
  + '''' + CONVERT(VARCHAR(10), FECHA_INGRESO, 120) + ''','
  + CAST(COSTO_ADQUIS AS VARCHAR(20)) + ','
  + CAST(VALOR_ACTUAL AS VARCHAR(20)) + ','
  + ISNULL('N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(OBSERVACIONES AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(FOTO_URL,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(FACTURA_URL,'''','''''') + '''','NULL') + ','
  + CAST(BORRADO AS VARCHAR(1)) + ');'
FROM ACTIVO;

-- ============================================================
--  MOVIMIENTO (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- MOVIMIENTO';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT MOVIMIENTO ON;';
SELECT 'INSERT INTO MOVIMIENTO (ID,ID_ACTIVO,UBICACION_ANT,UBICACION_NUE,DEPTO_ANT,DEPTO_NUE,AREA_ANT,AREA_NUE,ESTADO_ANT,ESTADO_NUE,OBSERVACION,ID_MOTIVO,ID_USUARIO,NOMBRE_USUARIO,FECHA) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(ID_ACTIVO,'''','''''') + ''','
  + ISNULL('N''' + REPLACE(CAST(UBICACION_ANT AS NVARCHAR(200)),'''','''''') + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(UBICACION_NUE AS NVARCHAR(200)),'''','''''') + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(DEPTO_ANT AS NVARCHAR(200)),'''','''''') + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(DEPTO_NUE AS NVARCHAR(200)),'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(AREA_ANT,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(AREA_NUE,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ESTADO_ANT,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ESTADO_NUE,'''','''''') + '''','NULL') + ','
  + 'N''' + REPLACE(CAST(OBSERVACION AS NVARCHAR(1000)),'''','''''') + ''','
  + ISNULL(CAST(ID_MOTIVO AS VARCHAR(10)),'NULL') + ','
  + ISNULL('''' + REPLACE(ID_USUARIO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(NOMBRE_USUARIO,'''','''''') + '''','NULL') + ','
  + '''' + CONVERT(VARCHAR(23), FECHA, 121) + ''');'
FROM MOVIMIENTO;
PRINT 'SET IDENTITY_INSERT MOVIMIENTO OFF;';

-- ============================================================
--  PLAN_MANT
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- PLAN_MANT';
PRINT '-- ============================================';
SELECT 'INSERT INTO PLAN_MANT (ID,CODIGO,DESCRIPCION,SUBFAM,CATEGORIA,FRECUENCIA,ID_CATEGORIA,ID_FAMILIA,FAM_NOMBRE,ID_SCOPE,ACTIVO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(CODIGO,'''','''''') + ''','
  + '''' + REPLACE(DESCRIPCION,'''','''''') + ''','
  + ISNULL('''' + REPLACE(SUBFAM,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(CATEGORIA,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(FRECUENCIA,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_CATEGORIA,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ID_FAMILIA,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(FAM_NOMBRE,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_SCOPE AS VARCHAR(10)),'NULL') + ','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM PLAN_MANT;

-- ============================================================
--  TAREA_PLAN
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- TAREA_PLAN';
PRINT '-- ============================================';
SELECT 'INSERT INTO TAREA_PLAN (ID,ID_PLAN,DESCRIPCION,FRECUENCIA,ORDEN,ACTIVO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + '''' + REPLACE(ID_PLAN,'''','''''') + ''','
  + 'N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(MAX)),'''','''''') + ''','
  + '''' + REPLACE(FRECUENCIA,'''','''''') + ''','
  + CAST(ORDEN AS VARCHAR(3)) + ','
  + CAST(ACTIVO AS VARCHAR(1)) + ');'
FROM TAREA_PLAN;

-- ============================================================
--  ORDEN_TRAB
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- ORDEN_TRAB';
PRINT '-- ============================================';
SELECT 'INSERT INTO ORDEN_TRAB (ID,ID_PLAN,ID_ACTIVO,ID_ASIGNADO,ID_SCOPE,TITULO,FECHA_INICIO,FECHA_FIN,NOTAS,ESTADO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PLAN,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(ID_ACTIVO,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_ASIGNADO,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_SCOPE AS VARCHAR(10)),'NULL') + ','
  + '''' + REPLACE(TITULO,'''','''''') + ''','
  + '''' + CONVERT(VARCHAR(10), FECHA_INICIO, 120) + ''','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_FIN, 120) + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(NOTAS AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ','
  + '''' + ESTADO + ''');'
FROM ORDEN_TRAB;

-- ============================================================
--  TICKET_MANT
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- TICKET_MANT';
PRINT '-- ============================================';
SELECT 'INSERT INTO TICKET_MANT (ID,ID_ORDEN_TRAB,ID_ACTIVO,ID_PLAN,ID_TIPO_MANT,ID_PROVEEDOR,ID_ASIGNADO,ID_SCOPE,TITULO,FECHA_INICIO,FECHA_FIN,ESTADO,COSTO,DESCRIPCION,BORRADO) VALUES ('
  + '''' + REPLACE(ID,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_ORDEN_TRAB,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(ID_ACTIVO,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PLAN,'''','''''') + '''','NULL') + ','
  + '''' + REPLACE(ID_TIPO_MANT,'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_PROVEEDOR,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ID_ASIGNADO,'''','''''') + '''','NULL') + ','
  + ISNULL(CAST(ID_SCOPE AS VARCHAR(10)),'NULL') + ','
  + '''' + REPLACE(TITULO,'''','''''') + ''','
  + '''' + CONVERT(VARCHAR(10), FECHA_INICIO, 120) + ''','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_FIN, 120) + '''','NULL') + ','
  + '''' + ESTADO + ''','
  + CAST(COSTO AS VARCHAR(20)) + ','
  + ISNULL('N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ','
  + CAST(BORRADO AS VARCHAR(1)) + ');'
FROM TICKET_MANT;

-- ============================================================
--  TAREA_TICKET (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- TAREA_TICKET';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT TAREA_TICKET ON;';
SELECT 'INSERT INTO TAREA_TICKET (ID,ID_TICKET,DESCRIPCION,COMPLETADO) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(ID_TICKET,'''','''''') + ''','
  + 'N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(MAX)),'''','''''') + ''','
  + CAST(COMPLETADO AS VARCHAR(1)) + ');'
FROM TAREA_TICKET;
PRINT 'SET IDENTITY_INSERT TAREA_TICKET OFF;';

-- ============================================================
--  REPROGRAMACION (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- REPROGRAMACION';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT REPROGRAMACION ON;';
SELECT 'INSERT INTO REPROGRAMACION (ID,ID_TICKET,FECHA_INI_ORI,FECHA_FIN_ORI,FECHA_INI_NUE,FECHA_FIN_NUE,MOTIVO,ID_USUARIO,NOMBRE_USUARIO) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + REPLACE(ID_TICKET,'''','''''') + ''','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_INI_ORI, 120) + '''','NULL') + ','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_FIN_ORI, 120) + '''','NULL') + ','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_INI_NUE, 120) + '''','NULL') + ','
  + ISNULL('''' + CONVERT(VARCHAR(10), FECHA_FIN_NUE, 120) + '''','NULL') + ','
  + 'N''' + REPLACE(CAST(MOTIVO AS NVARCHAR(500)),'''','''''') + ''','
  + ISNULL('''' + REPLACE(ID_USUARIO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(NOMBRE_USUARIO,'''','''''') + '''','NULL') + ');'
FROM REPROGRAMACION;
PRINT 'SET IDENTITY_INSERT REPROGRAMACION OFF;';

-- ============================================================
--  AUDITORIA (tiene IDENTITY)
-- ============================================================
PRINT '';
PRINT '-- ============================================';
PRINT '-- AUDITORIA';
PRINT '-- ============================================';
PRINT 'SET IDENTITY_INSERT AUDITORIA ON;';
SELECT 'INSERT INTO AUDITORIA (ID,FECHA,ACCION,ENTIDAD,ID_ENTIDAD,DESCRIPCION,ID_USUARIO,NOMBRE_USUARIO,CAMBIOS) VALUES ('
  + CAST(ID AS VARCHAR(10)) + ','
  + '''' + CONVERT(VARCHAR(23), FECHA, 121) + ''','
  + '''' + REPLACE(ACCION,'''','''''') + ''','
  + '''' + REPLACE(ENTIDAD,'''','''''') + ''','
  + '''' + REPLACE(ID_ENTIDAD,'''','''''') + ''','
  + ISNULL('N''' + REPLACE(CAST(DESCRIPCION AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(ID_USUARIO,'''','''''') + '''','NULL') + ','
  + ISNULL('''' + REPLACE(NOMBRE_USUARIO,'''','''''') + '''','NULL') + ','
  + ISNULL('N''' + REPLACE(CAST(CAMBIOS AS NVARCHAR(MAX)),'''','''''') + '''','NULL') + ');'
FROM AUDITORIA;
PRINT 'SET IDENTITY_INSERT AUDITORIA OFF;';

PRINT '';
PRINT '-- ============================================';
PRINT '-- EXPORTACION COMPLETADA';
PRINT '-- ============================================';
