import express from 'express';
import { getScopes, createScope, updateScope, deleteScope } from '../controllers/maintenanceScopes.controller.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/',     getScopes); // Lectura accesible: el sidebar lo necesita
router.post('/',    requirePermission('maintenances_scopes'), createScope);
router.put('/:id',  requirePermission('maintenances_scopes'), updateScope);
router.delete('/:id', requirePermission('maintenances_scopes'), deleteScope);

export default router;
