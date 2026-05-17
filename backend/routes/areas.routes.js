import express from 'express';
import { getAreas, createArea, updateArea, deleteArea } from '../controllers/areas.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',     getAreas); // Lectura accesible: se usa en formularios
router.post('/',    requirePermission('infrastructure_manage'), createArea);
router.put('/:id',  requirePermission('infrastructure_manage'), updateArea);
router.delete('/:id', requirePermission('infrastructure_manage'), deleteArea);

export default router;
