-- script.sql
USE SCAF_DB;
GO

-- 2. Asegurar estructura de Categorías, Frecuencias y PK/FK Faltantes (SCAF DB)
IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'Category' AND Object_ID = Object_ID(N'MaintenancePlans'))
BEGIN
    ALTER TABLE MaintenancePlans ADD Category VARCHAR(100) NULL;
END
IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'PlanFrequency' AND Object_ID = Object_ID(N'MaintenancePlans'))
BEGIN
    ALTER TABLE MaintenancePlans ADD PlanFrequency VARCHAR(50) NULL;
END
IF NOT EXISTS(SELECT * FROM sys.columns WHERE Name = N'PlanId' AND Object_ID = Object_ID(N'Maintenances'))
BEGIN
    ALTER TABLE Maintenances ADD PlanId VARCHAR(100) NULL;
END
GO

-- 1. Estandarizar UUIDs Aleatorios a Id PLAN-X en MaintenancePlans
-- Hacemos una tabla temporal o simplemente un script
DECLARE @IdAleatorio VARCHAR(100);
DECLARE @NuevoId VARCHAR(100);
DECLARE @Contador INT = 1;

DECLARE cur CURSOR FOR SELECT Id FROM MaintenancePlans WHERE Id NOT LIKE 'PLAN-%';
OPEN cur;
FETCH NEXT FROM cur INTO @IdAleatorio;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @NuevoId = 'PLAN-' + CAST(@Contador AS VARCHAR(10));
    
    -- Actualizar dependencias
    UPDATE MaintenancePlanTasks SET PlanId = @NuevoId WHERE PlanId = @IdAleatorio;
    
    IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'PlanId' AND Object_ID = Object_ID(N'MaintenanceTicketTasks'))
    BEGIN
        EXEC('UPDATE MaintenanceTicketTasks SET PlanId = ''' + @NuevoId + ''' WHERE PlanId = ''' + @IdAleatorio + '''');
    END

    UPDATE Maintenances SET PlanId = @NuevoId WHERE PlanId = @IdAleatorio;
    
    -- Actualizar padre
    UPDATE MaintenancePlans SET Id = @NuevoId WHERE Id = @IdAleatorio;
    
    SET @Contador = @Contador + 1;
    FETCH NEXT FROM cur INTO @IdAleatorio;
END
CLOSE cur;
DEALLOCATE cur;
GO

-- 3. Inyectar Planes de Prueba Profesionales
INSERT INTO MaintenancePlans (Id, Code, Description, SubFamily, Category, PlanFrequency)
VALUES 
('PLAN-DEMO-1', 'PLAN-100', 'Mantenimiento General Servidores', 'Servidores Fisicos', 'Equipos de Cómputo', 'Mensual'),
('PLAN-DEMO-2', 'PLAN-101', 'Inspección de Flotilla Operativa', 'Camionetas', 'Vehículos', 'Bimestral'),
('PLAN-DEMO-3', 'PLAN-102', 'Auditoría de Aire Acondicionado', 'Centrales AA', 'Mobiliario y Equipo de Oficina', 'Semestral');
GO

-- Inyectar Tareas Paso-a-Paso
INSERT INTO MaintenancePlanTasks (Id, PlanId, TaskDescription, Frequency)
VALUES 
(NEWID(), 'PLAN-DEMO-1', 'Limpieza profunda de disipadores', 'Mensual'),
(NEWID(), 'PLAN-DEMO-1', 'Verificación de pastas térmicas', 'Semestral'),
(NEWID(), 'PLAN-DEMO-1', 'Revisión de logs RAID', 'Mensual'),

(NEWID(), 'PLAN-DEMO-2', 'Cambio de Aceite 10W-30', 'Bimestral'),
(NEWID(), 'PLAN-DEMO-2', 'Alineación y Balanceo', 'Bimestral'),
(NEWID(), 'PLAN-DEMO-2', 'Revisión de niveles de refrigerante', 'Mensual'),

(NEWID(), 'PLAN-DEMO-3', 'Cambio de Filtros Industriales', 'Trimestral'),
(NEWID(), 'PLAN-DEMO-3', 'Medición de presión de gas freón', 'Semestral');
GO

-- 4. Inyectar Activos de Prueba
INSERT INTO Assets (Id, Name, Status, CategoryId, Family, SubFamily, AcquisitionCost, CurrentValue, Description, Serial)
VALUES
('ACT-SRV-01', 'Servidor PowerEdge R740', 'ACTIVO', 
 (SELECT TOP 1 Id FROM AssetCategories WHERE Name='Equipos de Cómputo'), 'Hardware', 'Servidores Fisicos', 5500, 5000, 'Servidor Central App', 'SN-R740-001'),
 
('ACT-VEH-01', 'Toyota Hilux 2024 Transporte', 'ACTIVO', 
 (SELECT TOP 1 Id FROM AssetCategories WHERE Name='Vehículos'), 'Camionetas', 'Camionetas', 35000, 32000, 'Unidad 01', 'SN-HILUX-002');
GO

-- Fin Inyección.
PRINT 'Inyección SCAF de datos de prueba finalizada correctamente';
