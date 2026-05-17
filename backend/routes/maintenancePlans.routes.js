import express from 'express';
import { getMaintenancePlans, batchMaintenancePlans, updateMaintenancePlan, deleteMaintenancePlan, updateMaintenancePlanTasks, generateBatchSchedule } from '../controllers/maintenancePlans.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('maintenances_plans', 'maintenances_view'), getMaintenancePlans);
router.post('/batch', requirePermission('maintenances_plans'), batchMaintenancePlans);
router.put('/:id', requirePermission('maintenances_plans'), updateMaintenancePlan);
router.delete('/:id', requirePermission('maintenances_plans'), deleteMaintenancePlan);
router.put('/:id/tasks', requirePermission('maintenances_plans'), updateMaintenancePlanTasks);
router.post('/generate-batch-schedule', requirePermission('maintenances_plans'), generateBatchSchedule);

export default router;
