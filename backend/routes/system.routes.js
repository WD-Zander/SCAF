import express from 'express';
import { requirePermission } from '../middleware/permissions.js';
import { factoryReset, testDb, saveDb, getSettings, updateSettings } from '../controllers/system.controller.js';

const router = express.Router();

// Solo SUPERADMIN puede ejecutar acciones destructivas
router.post('/factory-reset', requirePermission('all'), factoryReset);
router.post('/db/test', requirePermission('settings_edit'), testDb);
router.post('/db/save', requirePermission('all'), saveDb);

// Configuración de empresa: cualquier usuario autenticado puede leer, solo admins modificar
router.get('/settings', getSettings);
router.put('/settings', requirePermission('settings_edit'), updateSettings);

export default router;
