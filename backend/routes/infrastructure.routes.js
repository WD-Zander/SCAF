import { Router } from 'express';
import {
  getInfraTypes, createInfraType, updateInfraType, deleteInfraType,
  getInfraItems, createInfraItem, updateInfraItem, deleteInfraItem,
} from '../controllers/infrastructure.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = Router();

// Tipos
router.get('/types', getInfraTypes); // Lectura accesible: se usa en formularios
router.post('/types', requirePermission('infrastructure_manage'), createInfraType);
router.put('/types/:slug', requirePermission('infrastructure_manage'), updateInfraType);
router.delete('/types/:slug', requirePermission('infrastructure_manage'), deleteInfraType);

// Items
router.get('/items', getInfraItems); // Lectura accesible: se usa en formularios
router.post('/items', requirePermission('infrastructure_manage'), createInfraItem);
router.put('/items/:id', requirePermission('infrastructure_manage'), updateInfraItem);
router.delete('/items/:id', requirePermission('infrastructure_manage'), deleteInfraItem);

export default router;