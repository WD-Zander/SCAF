import express from 'express';
import { getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance, getMaintenanceTasks, updateMaintenanceTask, getRescheduled } from '../controllers/maintenances.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('maintenances_view'), getMaintenances);
router.get('/rescheduled', requirePermission('maintenances_view'), getRescheduled);
router.post('/', requirePermission('maintenances_create'), createMaintenance);
router.put('/:id', requirePermission('maintenances_edit'), updateMaintenance);
router.delete('/:id', requirePermission('maintenances_delete'), deleteMaintenance);
router.get('/:id/tasks', requirePermission('maintenances_view'), getMaintenanceTasks);
router.put('/tasks/:id', requirePermission('maintenances_status', 'maintenances_edit'), updateMaintenanceTask);

export default router;
