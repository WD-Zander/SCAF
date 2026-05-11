-- ============================================================
-- SCAF: Plan de Mantenimiento Preventivo para Secadoras
-- Basado en Plan.pdf - Cronograma con Fechas Reales
-- ============================================================
USE SCAF_DB;
GO

-- Limpiar plan anterior si existe (cuidado en producción)
DELETE FROM MaintenancePlanTasks WHERE PlanId = 'PLAN-SECADORAS-001';
DELETE FROM MaintenancePlans WHERE Id = 'PLAN-SECADORAS-001';
GO

-- Insertar el Plan General
INSERT INTO MaintenancePlans (Id, Code, Description, SubFamily, Category, PlanFrequency)
VALUES (
    'PLAN-SECADORAS-001',
    'PLAN-SEC-01',
    'Mantenimiento Preventivo Anual Secadoras',
    'Secadoras',
    'Lavandería',
    'Mensual'
);
GO

-- Insertar las 11 Tareas con sus Frecuencias (lógica del Plan.pdf)
INSERT INTO MaintenancePlanTasks (Id, PlanId, TaskDescription, Frequency)
VALUES
    (NEWID(), 'PLAN-SECADORAS-001', 'Limpieza de Filtros',                'Mensual'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Inspección de Bandas',               'Mensual'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Tensión de Correas',                 'Mensual'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Lubricación de Rodajes',             'Bimestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Verificación de Fugas de Gas',       'Bimestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Calibración de Sensores de Temperatura', 'Trimestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Limpieza de Quemadores',             'Trimestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Revisión de Sistema Eléctrico',      'Semestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Alineación de Motor',                'Semestral'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Cambio de Sellos',                   'Anual'),
    (NEWID(), 'PLAN-SECADORAS-001', 'Pintura de Base',                    'Anual');
GO

PRINT 'Plan PLAN-SECADORAS-001 insertado correctamente con 11 tareas.';
GO
