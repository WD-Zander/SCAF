import express from 'express';
import { getWorkOrders, createWorkOrder, deleteWorkOrder } from '../controllers/workOrders.controller.js';

const router = express.Router();

router.get('/', getWorkOrders);
router.post('/', createWorkOrder);
router.delete('/:id', deleteWorkOrder);

export default router;
