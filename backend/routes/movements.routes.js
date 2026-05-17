import express from 'express';
import { createMovement, getAllMovements, getMovementsByAsset } from '../controllers/movements.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', requirePermission('movements_view'), getAllMovements);
router.get('/asset/:assetId', requirePermission('movements_view', 'inventory_view'), getMovementsByAsset);
router.post('/', requirePermission('movements_create'), createMovement);

export default router;
