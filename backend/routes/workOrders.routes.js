import express from 'express';
import { getWorkOrders, createWorkOrder, deleteWorkOrder } from '../controllers/workOrders.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('maintenances_workorders', 'maintenances_view'), getWorkOrders);
router.post('/', requirePermission('maintenances_workorders'), createWorkOrder);
router.delete('/:id', requirePermission('maintenances_workorders'), deleteWorkOrder);

export default router;
