import express from 'express';
import { getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance, getMaintenanceTasks, updateMaintenanceTask, getRescheduled } from '../controllers/maintenances.controller.js';

const router = express.Router();

router.get('/', getMaintenances);
router.get('/rescheduled', getRescheduled);
router.post('/', createMaintenance);
router.put('/:id', updateMaintenance);
router.delete('/:id', deleteMaintenance);
router.get('/:id/tasks', getMaintenanceTasks);
router.put('/tasks/:id', updateMaintenanceTask);

export default router;
