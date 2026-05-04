import express from 'express';
import { getMaintenancePlans, batchMaintenancePlans, updateMaintenancePlan, deleteMaintenancePlan, updateMaintenancePlanTasks, generateBatchSchedule } from '../controllers/maintenancePlans.controller.js';

const router = express.Router();

router.get('/', getMaintenancePlans);
router.post('/batch', batchMaintenancePlans);
router.put('/:id', updateMaintenancePlan);
router.delete('/:id', deleteMaintenancePlan);
router.put('/:id/tasks', updateMaintenancePlanTasks);
router.post('/generate-batch-schedule', generateBatchSchedule);

export default router;
