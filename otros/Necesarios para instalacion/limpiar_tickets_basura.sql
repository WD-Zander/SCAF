-- Ejecutar en SSMS sobre SCAF_DB
-- Limpia TODOS los tickets con IDs no secuenciales (MT-17..., MT-00...)
USE SCAF_DB;
GO

-- Borrar tareas hijas primero
DELETE FROM MaintenanceTicketTasks 
WHERE TicketId NOT LIKE 'MT-[0-9][0-9][0-9]';
GO

-- Borrar tickets basura
DELETE FROM Maintenances 
WHERE Id NOT LIKE 'MT-[0-9][0-9][0-9]';
GO

-- Verificar estado limpio
SELECT Id, Title, StartDate, Status, PlanId FROM Maintenances ORDER BY Id;
GO

PRINT 'Limpieza completa. Solo quedan tickets con IDs secuenciales.'
